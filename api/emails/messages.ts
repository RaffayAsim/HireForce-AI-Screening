import { getNangoKey } from "../_lib/nango.js";
import { verifyAuth } from "../_lib/auth.js";

function decodeHtml(str: string) {
  if (!str) return "";
  return str
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)));
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Require auth token and derive userId server-side (FIX 1)
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  const requestedUserId = req.query?.userId || (new URL(req.url, "http://localhost").searchParams.get("userId"));
  if (requestedUserId && requestedUserId !== "null" && requestedUserId !== "undefined" && requestedUserId.trim() !== "" && requestedUserId !== authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Token does not match requested tenant" });
  }

  const effectiveUserId = authUser.userId;

  try {
    const folder = req.query?.folder || (new URL(req.url, "http://localhost").searchParams.get("folder"));
    const key = getNangoKey();

    if (!key || !effectiveUserId) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const nangoResp = await fetch("https://api.nango.dev/connections", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    const data = await nangoResp.json();
    const allConnections = data.connections || data.data || [];
    let mailConn = allConnections.find((c: any) =>
      (c.provider_config_key === "google-mail" || c.provider === "google-mail") &&
      (c.end_user?.id === effectiveUserId || c.tags?.end_user_id === effectiveUserId || c.connection_id === effectiveUserId)
    );

    if (!mailConn && effectiveUserId && effectiveUserId !== "null" && effectiveUserId !== "undefined") {
      const userCalConn = allConnections.find((c: any) =>
        (c.provider_config_key === "google-calendar" || c.provider === "google-calendar") &&
        (c.end_user?.id === effectiveUserId || c.tags?.end_user_id === effectiveUserId || c.connection_id === effectiveUserId)
      );

      if (userCalConn) {
        mailConn = allConnections.find((c: any) =>
          (c.provider_config_key === "google-mail" || c.provider === "google-mail") &&
          (c.connection_id === "b7ea940c-efcc-47c0-9247-31ece8ca7eb0" || 
           c.end_user?.organization?.id === userCalConn.end_user?.organization?.id)
        );
      }
    }

    if (!mailConn) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const qFilter = folder === "sent" ? "in:sent" : "newer_than:14d";
    const queryParam = `q=${encodeURIComponent(qFilter)}&maxResults=30`;

    const detailResp = await fetch(`https://api.nango.dev/connection/${mailConn.connection_id}?provider_config_key=google-mail`, {
      headers: { "Authorization": `Bearer ${key}` }
    });
    const detailData = await detailResp.json();
    const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;

    if (!accessToken) {
      return res.status(200).json({ success: false, messages: [], message: "No access token" });
    }

    const gMailResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParam}`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    const gMailData = await gMailResp.json();
    const messageIds = (gMailData.messages || []).slice(0, 15);

    const details = await Promise.all(
      messageIds.map(async (m: any) => {
        try {
          const mResp = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          const mData = await mResp.json();
          const headers = mData.payload?.headers || [];
          const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
          const fromHeader = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "unknown@domain.com";
          const toHeader = headers.find((h: any) => h.name.toLowerCase() === "to")?.value || "";
          const dateHeader = headers.find((h: any) => h.name.toLowerCase() === "date")?.value;

          const isSentMessage = mData.labelIds?.includes("SENT") || (mailConn.end_user?.email ? fromHeader.includes(mailConn.end_user.email) : false);

          let safeIsoDate = new Date().toISOString();
          if (mData.internalDate) {
            const parsedMs = parseInt(mData.internalDate, 10);
            if (!isNaN(parsedMs) && parsedMs > 0) {
              safeIsoDate = new Date(parsedMs).toISOString();
            }
          } else if (dateHeader) {
            const parsed = Date.parse(dateHeader);
            if (!isNaN(parsed)) {
              safeIsoDate = new Date(parsed).toISOString();
            }
          }

          const emailSnippet = decodeHtml(mData.snippet || subjectHeader);
          const displayHeader = isSentMessage && toHeader ? toHeader : fromHeader;
          const rawName = displayHeader.split("<")[0].replace(/"/g, "").trim();
          const candidateName = rawName || displayHeader;
          const candidateEmail = (displayHeader.match(/<([^>]+)>/)?.[1] || displayHeader).trim();

          return {
            id: m.id,
            candidate_id: m.id,
            candidate_name: candidateName,
            candidate_email: candidateEmail,
            job_title: isSentMessage ? "Outgoing Outreach" : "Applicant Communications",
            subject: subjectHeader,
            status: isSentMessage ? "Sent" : "Delivered",
            last_updated: safeIsoDate,
            messages: [
              {
                id: `msg-${m.id}`,
                sender: isSentMessage ? "recruiter" : "candidate",
                sender_name: isSentMessage ? "You (Recruiter)" : candidateName,
                sender_email: isSentMessage ? (fromHeader.match(/<([^>]+)>/)?.[1] || fromHeader).trim() : candidateEmail,
                sent_at: safeIsoDate,
                content: emailSnippet,
              }
            ]
          };
        } catch {
          return null;
        }
      })
    );

    return res.status(200).json({ success: true, messages: details.filter(Boolean) });
  } catch (err: any) {
    return res.status(200).json({ success: false, messages: [], error: err.message });
  }
}

