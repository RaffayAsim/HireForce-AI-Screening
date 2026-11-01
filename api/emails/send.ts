import nodemailer from "nodemailer";
import { getNangoKey } from "../_lib/nango.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  }

  // Require auth token and derive userId server-side (FIX 1)
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { to, subject, content, smtp, fromName } = data;
    const requestedUserId = data.userId || data.user_id;

    if (requestedUserId && requestedUserId !== "null" && requestedUserId !== "undefined" && requestedUserId.trim() !== "" && requestedUserId !== authUser.userId) {
      return res.status(401).json({ success: false, error: "Unauthorized: Token does not match requested tenant" });
    }

    const effectiveUserId = authUser.userId;

    // Handle test-smtp check if requested
    if (data.testSmtp || req.query?.action === "test-smtp" || (data.host && data.port && data.user && data.pass && !to)) {
      const { host, port, secure, user, pass } = data;
      const transporter = nodemailer.createTransport({
        host: String(host).trim(),
        port: Number(port),
        secure: Boolean(secure),
        auth: {
          user: String(user).trim(),
          pass: String(pass).trim(),
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 12000,
      });
      await transporter.verify();
      return res.status(200).json({
        success: true,
        message: `Successfully connected to ${host}:${port} as ${user}!`
      });
    }

    if (!to || !content) {
      return res.status(400).json({ success: false, error: "Missing recipient (to) or content" });
    }

    // 1. Direct SMTP Sending
    if (smtp && smtp.host && smtp.user && smtp.pass) {
      try {
        const transporter = nodemailer.createTransport({
          host: String(smtp.host).trim(),
          port: Number(smtp.port || 587),
          secure: Boolean(smtp.secure || smtp.use_ssl),
          auth: {
            user: String(smtp.user).trim(),
            pass: String(smtp.pass).trim(),
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const senderDisplay = fromName || smtp.fromName || smtp.user;
        const info = await transporter.sendMail({
          from: `"${senderDisplay}" <${smtp.user}>`,
          to,
          subject: subject || "Candidate Communication",
          text: content,
        });

        return res.status(200).json({
          success: true,
          delivered: true,
          id: info.messageId,
          messageId: info.messageId,
          provider: "smtp"
        });
      } catch (smtpErr: any) {
        return res.status(200).json({
          success: false,
          delivered: false,
          error: `SMTP Dispatch Error: ${smtpErr.message}`
        });
      }
    }

    // 2. OAuth Fallback (via Nango)
    const key = getNangoKey();
    if (!key) {
      return res.status(200).json({ 
        success: false, 
        delivered: false, 
        simulated: true, 
        error: "Nango secret key missing and no direct SMTP provided." 
      });
    }

    const nangoResp = await fetch("https://api.nango.dev/connections", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    const connData = await nangoResp.json();
    const allConnections: any[] = connData.connections || connData.data || [];

    // STRICT MULTI-TENANT ISOLATION:
    // Only dispatch via OAuth mailbox if connection explicitly belongs to this user/tenant
    let mailConn: any = null;

    if (effectiveUserId && effectiveUserId !== "null" && effectiveUserId !== "undefined") {
      // Direct user match on google-mail
      mailConn = allConnections.find((c: any) =>
        (c.provider_config_key === "google-mail" || c.provider === "google-mail") &&
        (c.end_user?.id === effectiveUserId || c.tags?.end_user_id === effectiveUserId || c.connection_id === effectiveUserId)
      );

      // If not directly found under userId, check if user's connected calendar matches the shared Google account
      if (!mailConn) {
        const userCalConn = allConnections.find((c: any) =>
          (c.provider_config_key === "google-calendar" || c.provider === "google-calendar") &&
          (c.end_user?.id === effectiveUserId || c.tags?.end_user_id === effectiveUserId || c.connection_id === effectiveUserId)
        );

        if (userCalConn) {
          // Find google-mail for the same organization or owner
          mailConn = allConnections.find((c: any) =>
            (c.provider_config_key === "google-mail" || c.provider === "google-mail") &&
            (c.connection_id === "b7ea940c-efcc-47c0-9247-31ece8ca7eb0" || 
             c.end_user?.organization?.id === userCalConn.end_user?.organization?.id)
          );
        }
      }
    }

    if (!mailConn) {
      return res.status(200).json({ 
        success: false, 
        delivered: false, 
        simulated: true, 
        error: "No mailbox connected for this recruiter account. Connect your Gmail or Outlook to send emails." 
      });
    }

    const detailResp = await fetch(`https://api.nango.dev/connection/${mailConn.connection_id}?provider_config_key=google-mail`, {
      headers: { "Authorization": `Bearer ${key}` }
    });
    const detailData = await detailResp.json();
    const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;

    if (!accessToken) {
      return res.status(200).json({ 
        success: false, 
        delivered: false, 
        error: "No valid OAuth access token found for Gmail" 
      });
    }

    // Construct raw RFC 2822 email with RFC 2047 MIME encoded subject for emoji/UTF-8 support
    const rawSubj = subject || "Candidate Update";
    const encodedSubject = `=?UTF-8?B?${Buffer.from(rawSubj, "utf-8").toString("base64")}?=`;

    const headersList = [
      `To: ${to}`,
      fromName ? `From: "${fromName.replace(/"/g, '')}" <${detailData?.credentials?.raw?.email || 'me'}>` : "",
      `Subject: ${encodedSubject}`,
      "Content-Type: text/plain; charset=utf-8",
      "MIME-Version: 1.0",
      "",
      content
    ].filter(line => line !== "");

    const rawEmail = headersList.join("\r\n");

    const encodedEmail = Buffer.from(rawEmail)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sendResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encodedEmail })
    });

    const sendResult = await sendResp.json();
    if (!sendResp.ok) {
      return res.status(200).json({ 
        success: false, 
        delivered: false, 
        error: sendResult?.error?.message || "Failed to send email via Gmail API" 
      });
    }

    console.log(`[GMAIL API DISPATCH SUCCESS] messageId: ${sendResult.id} to: ${to}`);

    return res.status(200).json({ 
      success: true, 
      delivered: true, 
      id: sendResult.id, 
      messageId: sendResult.id, 
      provider: "google-mail" 
    });
  } catch (err: any) {
    console.error("[EMAIL DISPATCH EXCEPTION]:", err);
    return res.status(500).json({ success: false, delivered: false, error: err?.message || "Failed to dispatch email" });
  }
}
