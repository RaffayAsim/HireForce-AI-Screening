import { createClient } from "@supabase/supabase-js";
import { verifyAuth } from "../_lib/auth.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  const { id } = req.query || {};
  if (!id) {
    return res.status(400).json({ success: false, error: "Missing candidate id" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://fobfgvmwfzoxzzcheusm.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIxMzE2MCwiZXhwIjoyMTA4Nzg5MTYwfQ.WwWjdxSzQTdWIeMzb8HrtA6mTlB595mUEn_0M8zVWCE";
  const sb = createClient(supabaseUrl, supabaseKey);

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (req.method === "PATCH" || req.method === "PUT") {
      const allowedFields = ["status", "screening_score", "screening_summary", "job_id", "notes"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }

      let query = sb.from("candidates").update(updates).eq("id", id);
      if (authUser.userId !== "admin-001") {
        query = query.eq("user_id", authUser.userId);
      }

      const { data, error } = await query.select().maybeSingle();
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(200).json({
        success: true,
        id,
        candidate: data || { id, ...updates },
        message: "Candidate updated successfully"
      });
    }

    if (req.method === "GET") {
      let query = sb.from("candidates").select("*").eq("id", id);
      if (authUser.userId !== "admin-001") {
        query = query.eq("user_id", authUser.userId);
      }
      const { data, error } = await query.maybeSingle();
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.status(200).json({
        success: true,
        candidate: data
      });
    }

    if (req.method === "DELETE") {
      let query = sb.from("candidates").delete().eq("id", id);
      if (authUser.userId !== "admin-001") {
        query = query.eq("user_id", authUser.userId);
      }
      const { error } = await query;
      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.status(200).json({
        success: true,
        id,
        message: "Candidate deleted successfully"
      });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
