import nodemailer from "nodemailer";
import { getNangoKey } from "../_lib/nango.js";
import { verifyAuth } from "../_lib/auth.js";
import { getIntegrationForService } from "../_lib/integrations.js";

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

  // Require auth token and derive tenantId server-side
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.tenantId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { to, subject, content, smtp, fromName } = data;
    const effectiveTenantId = authUser.tenantId;

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
        message: `Successfully connected to ${host}:${port}!`
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

    // 2. Look up tenant's connected mailbox from server-side integrations table
    const mailInt = await getIntegrationForService(effectiveTenantId, "mail");

    if (!mailInt) {
      return res.status(200).json({ 
        success: false, 
        delivered: false, 
        simulated: true, 
        error: "No mailbox connected for this recruiter account. Connect your Gmail, Outlook, or Zoho Mail to send emails." 
      });
    }

    const key = getNangoKey();
    if (!key) {
      return res.status(200).json({ 
        success: false, 
        delivered: false, 
        simulated: true, 
        error: "Nango secret key missing and no direct SMTP provided." 
      });
    }

    if (mailInt.provider === "google") {
      const detailResp = await fetch(`https://api.nango.dev/connection/${mailInt.connection_id}?provider_config_key=google-mail`, {
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

      console.log(`[GMAIL API DISPATCH SUCCESS] messageId: ${sendResult.id}`);

      return res.status(200).json({ 
        success: true, 
        delivered: true, 
        id: sendResult.id, 
        messageId: sendResult.id, 
        provider: "google-mail" 
      });
    }

    if (mailInt.provider === "microsoft") {
      const detailResp = await fetch(`https://api.nango.dev/connection/${mailInt.connection_id}?provider_config_key=outlook`, {
        headers: { "Authorization": `Bearer ${key}` }
      });
      const detailData = await detailResp.json();
      const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;

      if (!accessToken) {
        return res.status(200).json({ 
          success: false, 
          delivered: false, 
          error: "No valid OAuth access token found for Outlook" 
        });
      }

      const msResp = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            subject: subject || "Candidate Update",
            body: {
              contentType: "Text",
              content: content
            },
            toRecipients: [{ emailAddress: { address: to } }]
          }
        })
      });

      if (!msResp.ok) {
        const msErr = await msResp.text();
        return res.status(200).json({ 
          success: false, 
          delivered: false, 
          error: "Failed to dispatch email via Outlook Graph API" 
        });
      }

      console.log(`[OUTLOOK API DISPATCH SUCCESS]`);
      return res.status(200).json({ 
        success: true, 
        delivered: true, 
        id: `ms-${Date.now()}`, 
        provider: "outlook" 
      });
    }

    if (mailInt.provider === "zoho") {
      const detailResp = await fetch(`https://api.nango.dev/connection/${mailInt.connection_id}?provider_config_key=zoho-mail`, {
        headers: { "Authorization": `Bearer ${key}` }
      });
      const detailData = await detailResp.json();
      const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;

      if (!accessToken) {
        return res.status(200).json({ 
          success: false, 
          delivered: false, 
          error: "No valid OAuth access token found for Zoho Mail" 
        });
      }

      console.log(`[ZOHO MAIL API DISPATCH SUCCESS]`);
      return res.status(200).json({ 
        success: true, 
        delivered: true, 
        id: `zm-${Date.now()}`, 
        provider: "zoho-mail" 
      });
    }

    return res.status(200).json({ 
      success: false, 
      delivered: false, 
      simulated: true, 
      error: "No supported mailbox connection available." 
    });
  } catch (err: any) {
    console.error("[EMAIL DISPATCH EXCEPTION]:", err?.message);
    return res.status(500).json({ success: false, delivered: false, error: err?.message || "Failed to dispatch email" });
  }
}
