import { getNangoKey } from "../_lib/nango.js";
import { verifyAuth } from "../_lib/auth.js";
import { getIntegrations, saveIntegration, deleteIntegration } from "../_lib/integrations.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Require auth token and derive tenantId server-side
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.tenantId) {
    return res.status(401).json({ success: false, connected: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  const effectiveTenantId = authUser.tenantId;
  const action = req.query?.action || (req.url?.includes("/api/integrations") ? "integrations" : "");

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch { body = {}; }
  } else if (body && typeof body === "object" && Buffer.isBuffer(body)) {
    try { body = JSON.parse(body.toString("utf8") || "{}"); } catch { body = {}; }
  } else if (!body) {
    body = {};
  }

  // ----------------------------------------------------
  // ACTION: INTEGRATIONS (LIST, SAVE, DELETE)
  // ----------------------------------------------------
  if (action === "integrations" || req.url?.includes("/api/integrations")) {
    if (req.method === "GET") {
      const ints = await getIntegrations(effectiveTenantId);
      return res.status(200).json({ success: true, integrations: ints });
    }

    if (req.method === "DELETE") {
      const provider = req.query?.provider || body?.provider;
      const service = req.query?.service || body?.service;
      await deleteIntegration(effectiveTenantId, provider, service);
      return res.status(200).json({ success: true, message: "Disconnected successfully" });
    }

    if (req.method === "POST") {
      const { provider, service, connectionId, accountEmail } = body;
      if (!provider || !service || !connectionId) {
        return res.status(400).json({ success: false, error: "Missing required integration fields" });
      }
      const saved = await saveIntegration(effectiveTenantId, provider, service, connectionId, accountEmail || "");
      return res.status(200).json({ success: true, integration: saved });
    }
  }

  // ----------------------------------------------------
  // ACTION: NANGO CHECK-CONNECTION
  // ----------------------------------------------------
  if (req.method !== "GET") {
    return res.status(405).json({ connected: false, error: "Method Not Allowed" });
  }

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

    // STRICT MULTI-TENANT FILTERING BY SERVER-DERIVED effectiveTenantId ONLY
    connections = connections.filter((c: any) =>
      c.end_user?.id === effectiveTenantId ||
      c.tags?.end_user_id === effectiveTenantId ||
      c.connection_id === effectiveTenantId
    );

    // If no direct Nango connections found under tenantId, check existing saved integrations
    const savedInts = await getIntegrations(effectiveTenantId);
    if (connections.length === 0) {
      if (savedInts.length > 0) {
        const matchingInt = requestedProvider
          ? savedInts.find(i => i.provider === requestedProvider || (requestedProvider.includes(i.provider)))
          : savedInts[0];
        if (matchingInt) {
          return res.status(200).json({
            connected: true,
            email: matchingInt.account_email,
            recruiterName: matchingInt.account_email.split("@")[0],
            provider: matchingInt.provider,
            connectionId: matchingInt.connection_id,
            emailConnected: savedInts.some(i => i.service === "mail"),
            calendarConnected: savedInts.some(i => i.service === "calendar"),
            hasMailConnection: savedInts.some(i => i.service === "mail"),
            hasCalendarConnection: savedInts.some(i => i.service === "calendar"),
          });
        }
      }
      return res.status(200).json({ connected: false });
    }

    const mailConn = connections.find((c: any) =>
      c.provider_config_key === "google-mail" || c.provider === "google-mail" || c.provider === "outlook" || c.provider === "zoho-mail"
    );
    const calConn = connections.find((c: any) =>
      c.provider_config_key === "google-calendar" || c.provider === "google-calendar" || c.provider === "microsoft-teams" || c.provider === "apple-calendar" || c.provider === "zoho-calendar"
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
      const fetchConnId = targetConn.connection_id;
      const fetchProviderKey = targetConn.provider_config_key || targetConn.provider;

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
    } catch {}

    // Auto-save verified connection to integrations table for this tenant
    const cfg = targetConn.provider_config_key || targetConn.provider || "";
    if (cfg.includes("google")) {
      if (cfg.includes("calendar")) {
        await saveIntegration(effectiveTenantId, "google", "calendar", targetConn.connection_id, realEmail);
        await saveIntegration(effectiveTenantId, "google", "meeting", targetConn.connection_id, realEmail);
      }
      if (cfg.includes("mail")) {
        await saveIntegration(effectiveTenantId, "google", "mail", targetConn.connection_id, realEmail);
      }
    } else if (cfg.includes("outlook") || cfg.includes("microsoft") || cfg.includes("teams")) {
      if (cfg.includes("mail") || cfg === "outlook") {
        await saveIntegration(effectiveTenantId, "microsoft", "mail", targetConn.connection_id, realEmail);
      }
      if (cfg.includes("calendar") || cfg === "outlook") {
        await saveIntegration(effectiveTenantId, "microsoft", "calendar", targetConn.connection_id, realEmail);
      }
      if (cfg.includes("teams")) {
        await saveIntegration(effectiveTenantId, "microsoft", "meeting", targetConn.connection_id, realEmail);
        await saveIntegration(effectiveTenantId, "microsoft", "calendar", targetConn.connection_id, realEmail);
      }
    } else if (cfg.includes("zoho")) {
      if (cfg.includes("mail")) {
        await saveIntegration(effectiveTenantId, "zoho", "mail", targetConn.connection_id, realEmail);
      }
      if (cfg.includes("calendar")) {
        await saveIntegration(effectiveTenantId, "zoho", "calendar", targetConn.connection_id, realEmail);
      }
      if (cfg.includes("meeting")) {
        await saveIntegration(effectiveTenantId, "zoho", "meeting", targetConn.connection_id, realEmail);
      }
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
