import { createClient } from "@supabase/supabase-js";
import { verifyAuth, createSessionToken } from "../_lib/auth.js";
import { getNangoKey } from "../_lib/nango.js";
import { deleteIntegration } from "../_lib/integrations.js";

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
    if (req.method === "POST" && (req.query?.action === "clear-all-demo-data" || req.url?.includes("/api/clear-all-demo-data"))) {
      // 1. Delete candidates
      await sb.from("candidates").delete().eq("user_id", effectiveUserId);
      // 2. Delete jobs
      await sb.from("jobs").delete().eq("user_id", effectiveUserId);
      // 3. Delete interviews
      try { await sb.from("interviews").delete().eq("user_id", effectiveUserId); } catch {}
      // 4. Delete integrations
      await deleteIntegration(effectiveUserId);
      // 5. Delete Nango connections
      const nKey = getNangoKey();
      if (nKey) {
        try {
          const nangoResp = await fetch("https://api.nango.dev/connections", {
            headers: { "Authorization": `Bearer ${nKey}` }
          });
          if (nangoResp.ok) {
            const nData = await nangoResp.json();
            const conns = (nData.connections || nData.data || []).filter((c: any) =>
              c.end_user?.id === effectiveUserId ||
              c.tags?.end_user_id === effectiveUserId ||
              c.connection_id === effectiveUserId
            );
            for (const conn of conns) {
              const provKey = conn.provider_config_key || conn.provider;
              await fetch(`https://api.nango.dev/connection/${conn.connection_id}?provider_config_key=${provKey}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${nKey}` }
              });
            }
          }
        } catch (nErr) {
          console.warn("Error deleting Nango connections:", nErr);
        }
      }
      // 6. Reset trial screenings used if free_trial
      try {
        await sb.from("tenant_plans").update({ screenings_used: 0, updated_at: new Date().toISOString() }).eq("tenant_id", effectiveUserId);
      } catch {}

      return res.status(200).json({
        success: true,
        message: "Workspace data, jobs, candidates, and connections cleared successfully.",
        tenantId: effectiveUserId
      });
    }

    if (req.method === "GET") {
      let query = sb.from("candidates").select("*").order("created_at", { ascending: false });
      if (effectiveUserId !== "admin-001") {
        query = query.eq("user_id", effectiveUserId);
      }
      const { data, error } = await query;
      const sanitizedCandidates = (data || []).map((cand: any) => ({
        ...cand,
        screening_summary: cand.screening_summary
          ? cand.screening_summary.split("<!-- RESUME_TEXT_CACHE -->")[0].replace(/\[Engine:[^\]]+\]/gi, "").trim()
          : cand.screening_summary
      }));
      return res.status(200).json({ success: true, candidates: sanitizedCandidates });
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
