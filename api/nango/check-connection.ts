import { getNangoKey } from "../_lib/nango.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ connected: false, error: "Method Not Allowed" });
  }

  // Require auth token and derive userId server-side (FIX 1)
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ connected: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  const requestedUserId = req.query?.userId || (new URL(req.url, "http://localhost").searchParams.get("userId"));
  if (requestedUserId && requestedUserId !== "null" && requestedUserId !== "undefined" && requestedUserId.trim() !== "" && requestedUserId !== authUser.userId) {
    return res.status(401).json({ connected: false, error: "Unauthorized: Token does not match requested tenant" });
  }

  const effectiveUserId = authUser.userId;

  try {
    const requestedProvider = req.query?.provider || (new URL(req.url, "http://localhost").searchParams.get("provider"));
    const key = getNangoKey();

    if (!key) {
      return res.status(200).json({ connected: false, message: "No Nango key configured" });
    }

    const nangoResp = await fetch("https://api.nango.dev/connections", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    const data = await nangoResp.json();
    let connections = data.connections || data.data || [];

    connections = connections.filter((c: any) =>
      c.end_user?.id === effectiveUserId ||
      c.tags?.end_user_id === effectiveUserId ||
      c.connection_id === effectiveUserId
    );

    if (connections.length === 0) {
      return res.status(200).json({ connected: false });
    }

    const mailConn = connections.find((c: any) =>
      c.provider_config_key === "google-mail" || c.provider === "google-mail" || c.provider === "outlook"
    );
    const calConn = connections.find((c: any) =>
      c.provider_config_key === "google-calendar" || c.provider === "google-calendar" || c.provider === "microsoft-teams" || c.provider === "apple-calendar"
    );

    const targetConn = requestedProvider
      ? connections.find((c: any) => c.provider_config_key === requestedProvider || c.provider === requestedProvider)
      : (mailConn || calConn || connections[0]);

    if (!targetConn) {
      return res.status(200).json({ connected: false });
    }

    let realEmail = targetConn?.end_user?.email || "";
    let realName = targetConn?.end_user?.display_name || "";

    // Extract real OAuth email from provider tokens if possible
    try {
      const fetchConnId = mailConn?.connection_id || calConn?.connection_id || targetConn.connection_id;
      const fetchProviderKey = mailConn?.provider_config_key || calConn?.provider_config_key || targetConn.provider_config_key;

      const detailResp = await fetch(`https://api.nango.dev/connection/${fetchConnId}?provider_config_key=${fetchProviderKey}`, {
        headers: { "Authorization": `Bearer ${key}` }
      });
      const detailData = await detailResp.json();
      const accessToken = detailData?.credentials?.access_token || detailData?.credentials?.raw?.access_token;

      if (accessToken) {
        if (fetchProviderKey === "google-mail") {
          const gProfileResp = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          if (gProfileResp.ok) {
            const gProfile = await gProfileResp.json();
            if (gProfile.emailAddress) {
              realEmail = gProfile.emailAddress;
              realName = gProfile.emailAddress.split("@")[0];
            }
          }
        } else if (fetchProviderKey === "google-calendar") {
          const calResp = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList/primary", {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          if (calResp.ok) {
            const calData = await calResp.json();
            if (calData.id && calData.id.includes("@")) {
              realEmail = calData.id;
              realName = calData.summary || calData.id.split("@")[0];
            }
          }
        }
      }
    } catch (err) {
      console.warn("[CHECK PROFILE EXTRACTION]:", err);
    }

    return res.status(200).json({
      connected: true,
      email: realEmail,
      recruiterName: realName,
      provider: targetConn.provider_config_key || targetConn.provider,
      connectionId: targetConn.connection_id,
      emailConnected: Boolean(mailConn),
      calendarConnected: Boolean(calConn),
      hasMailConnection: Boolean(mailConn),
      hasCalendarConnection: Boolean(calConn),
    });
  } catch (err: any) {
    return res.status(200).json({ connected: false, error: err.message });
  }
}

