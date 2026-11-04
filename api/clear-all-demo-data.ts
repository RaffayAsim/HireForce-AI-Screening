import { createClient } from "@supabase/supabase-js";
import { verifyAuth } from "./_lib/auth.js";
import { getNangoKey } from "./_lib/nango.js";
import { deleteIntegration } from "./_lib/integrations.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method Not Allowed. Expected POST." });
  }

  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.tenantId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  const tenantId = authUser.tenantId;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://fobfgvmwfzoxzzcheusm.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIxMzE2MCwiZXhwIjoyMTA4Nzg5MTYwfQ.WwWjdxSzQTdWIeMzb8HrtA6mTlB595mUEn_0M8zVWCE";
  const sb = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Delete candidates belonging to tenant
    await sb.from("candidates").delete().eq("user_id", tenantId);

    // 2. Delete jobs belonging to tenant
    await sb.from("jobs").delete().eq("user_id", tenantId);

    // 3. Delete interviews belonging to tenant if table exists
    try {
      await sb.from("interviews").delete().eq("user_id", tenantId);
    } catch {}

    // 4. Delete all database integrations for this tenant
    await deleteIntegration(tenantId);

    // 5. Delete active Nango connections for this tenant
    const nKey = getNangoKey();
    if (nKey) {
      try {
        const nangoResp = await fetch("https://api.nango.dev/connections", {
          headers: { "Authorization": `Bearer ${nKey}` }
        });
        if (nangoResp.ok) {
          const nData = await nangoResp.json();
          const conns = (nData.connections || nData.data || []).filter((c: any) =>
            c.end_user?.id === tenantId ||
            c.tags?.end_user_id === tenantId ||
            c.connection_id === tenantId
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
      await sb.from("tenant_plans").update({ screenings_used: 0, updated_at: new Date().toISOString() }).eq("tenant_id", tenantId);
    } catch {}

    return res.status(200).json({
      success: true,
      message: "Workspace data, jobs, candidates, and connections cleared successfully.",
      tenantId
    });
  } catch (err: any) {
    console.error("Clear all demo data error:", err);
    return res.status(500).json({ success: false, error: err?.message || "Failed to clear workspace data" });
  }
}
