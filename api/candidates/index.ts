import { createClient } from "@supabase/supabase-js";
import { verifyAuth, createSessionToken } from "../_lib/auth.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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

  const requestedUserId = req.query?.userId || req.query?.user_id;
  if (requestedUserId && requestedUserId !== "null" && requestedUserId !== "undefined" && requestedUserId.trim() !== "" && requestedUserId !== authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Token does not match requested tenant" });
  }

  const effectiveUserId = authUser.userId;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://fobfgvmwfzoxzzcheusm.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIxMzE2MCwiZXhwIjoyMTA4Nzg5MTYwfQ.WwWjdxSzQTdWIeMzb8HrtA6mTlB595mUEn_0M8zVWCE";
  const sb = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === "GET") {
      let query = sb.from("candidates").select("*").order("created_at", { ascending: false });
      if (effectiveUserId !== "admin-001") {
        query = query.eq("user_id", effectiveUserId);
      }
      const { data, error } = await query;
      return res.status(200).json({ success: true, candidates: data || [] });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    body.user_id = effectiveUserId;

    // If POST /api/candidates is called with candidate data
    if (req.method === "POST" && body.id) {
      const candidateId = body.id;
      const candidateName = body.full_name || body.name;
      const candidateEmail = body.email;
      const resumeUrl = body.resume_url;
      const resumeText = body.resume_text || body.resumeText;
      const jobTitle = body.jobTitle || body.job_title || "Position";

      // If the candidate needs screening or has only a placeholder summary, trigger /api/screen-candidate
      if (resumeUrl && (!body.screening_score || (body.screening_summary && body.screening_summary.includes("Automated screening evaluation initialized")))) {
        try {
          const host = req.headers["host"] || "hire-force-ai-screening.vercel.app";
          const protocol = host.includes("localhost") ? "http" : "https";
          fetch(`${protocol}://${host}/api/screen-candidate`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${createSessionToken(effectiveUserId)}`
            },
            body: JSON.stringify({
              candidateId,
              candidateName,
              candidateEmail,
              jobTitle,
              resumeUrl,
              resumeText,
              userId: effectiveUserId,
            })
          }).catch(() => {});
        } catch {}
      }
    }

    return res.status(200).json({ success: true, ...body });
  } catch (err: any) {
    return res.status(200).json({ success: false, error: err.message });
  }
}
