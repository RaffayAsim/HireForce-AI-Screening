import { Nango } from "@nangohq/node";
import { getNangoKey } from "../_lib/nango.js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed. Expected POST.`
    });
  }

  // Require auth token and derive userId server-side (FIX 1)
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    data.userId = authUser.userId;
    const secretKey = data.secretKey || getNangoKey();

    if (!secretKey) {
      return res.status(200).json({
        success: false,
        needsSetup: true,
        message: "Nango Secret Key is not configured yet."
      });
    }

    // Filter allowed integrations by specific provider or category (email vs calendar)
    let allowedIntegrations: string[] | undefined = undefined;
    if (data.integration) {
      allowedIntegrations = [String(data.integration)];
    } else if (Array.isArray(data.allowedIntegrations) && data.allowedIntegrations.length > 0) {
      allowedIntegrations = data.allowedIntegrations;
    } else if (data.category === "email") {
      allowedIntegrations = ["google-mail", "outlook", "zoho-mail"];
    } else if (data.category === "calendar") {
      allowedIntegrations = ["google-calendar", "apple-calendar", "outlook", "microsoft-teams"];
    } else if (data.category === "meeting") {
      allowedIntegrations = ["microsoft-teams", "google-calendar"];
    }

    const nango = new Nango({ apiKey: secretKey });
    const validUserEmail = (data.email && typeof data.email === "string" && data.email.includes("@"))
      ? data.email
      : "recruiter@hireforce.ai";

    const sessionPayload: any = {
      end_user: {
        id: String(data.userId || "recruiter_lead"),
        email: validUserEmail,
        display_name: data.recruiterName || "Recruiter",
      },
      organization: {
        id: "org_hireforce",
        display_name: "HireForce AI",
      },
      tags: {
        platform: "HireForce AI",
        end_user_id: String(data.userId || "recruiter_lead"),
        end_user_email: validUserEmail,
        category: String(data.category || "all"),
      },
    };

    if (allowedIntegrations && allowedIntegrations.length > 0) {
      sessionPayload.allowed_integrations = allowedIntegrations;
    }

    const session = await nango.createConnectSession(sessionPayload);

    const token = (session as any)?.data?.token || (session as any)?.token;
    const connectLink = (session as any)?.data?.connect_link || (session as any)?.connect_link;

    const directProvider = (allowedIntegrations && allowedIntegrations.length === 1) ? allowedIntegrations[0] : null;
    const directAuthUrl = directProvider
      ? `https://api.nango.dev/oauth/connect/${directProvider}?connect_session_token=${token}`
      : connectLink;

    return res.status(200).json({
      success: true,
      sessionToken: token,
      connectLink: directAuthUrl,
      nangoConnectLink: connectLink,
      directAuthUrl: directAuthUrl,
      allowedIntegrations: allowedIntegrations,
    });
  } catch (err: any) {
    console.error("[NANGO ERROR]:", err?.response?.data || err.message);
    return res.status(200).json({
      success: false,
      error: err?.response?.data?.message || err?.message || "Failed to create Nango Connect Session",
    });
  }
}

