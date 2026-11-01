import { createClient } from "@supabase/supabase-js";
import { verifyAuth } from "./_lib/auth.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://fobfgvmwfzoxzzcheusm.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIxMzE2MCwiZXhwIjoyMTA4Nzg5MTYwfQ.WwWjdxSzQTdWIeMzb8HrtA6mTlB595mUEn_0M8zVWCE";
  const sb = createClient(supabaseUrl, supabaseKey);

  // 1. Unauthenticated or Public GET request
  const isPublic = req.query?.public === "true" || req.query?.public === true;
  const jobId = req.query?.id || req.query?.jobId;

  if (req.method === "GET" && isPublic) {
    try {
      let query = sb
        .from("jobs")
        .select("id, title, department, location, description, requirements, salary, status, user_id, created_at")
        .in("status", ["Active", "open", "active"]);

      if (jobId) {
        query = query.eq("id", jobId);
        const { data, error } = await query.maybeSingle();
        if (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
        return res.status(200).json({ success: true, job: data });
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
      return res.status(200).json({ success: true, jobs: data || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // 2. All other actions require valid recruiter authentication
  const authUser = await verifyAuth(req);
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
  }

  const effectiveUserId = authUser.userId;

  try {
    if (req.method === "GET") {
      let query = sb
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (jobId) {
        query = query.eq("id", jobId);
        if (effectiveUserId !== "admin-001") {
          query = query.eq("user_id", effectiveUserId);
        }
        const { data, error } = await query.maybeSingle();
        if (error) return res.status(500).json({ success: false, error: error.message });
        return res.status(200).json({ success: true, job: data });
      }

      if (effectiveUserId !== "admin-001") {
        query = query.eq("user_id", effectiveUserId);
      }

      const { data, error } = await query;
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.status(200).json({ success: true, jobs: data || [] });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (req.method === "POST") {
      const newJobId = body.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const jobData = {
        id: newJobId,
        title: body.title,
        description: body.description || "",
        requirements: body.requirements || "",
        location: body.location || "Remote",
        department: body.department || "General",
        salary: body.salary || "",
        status: body.status || "Active",
        user_id: effectiveUserId,
      };

      const { data, error } = await sb
        .from("jobs")
        .upsert([jobData], { onConflict: "id" })
        .select()
        .maybeSingle();

      if (error) {
        console.error("Supabase job insert error in /api/jobs:", error);
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, job: data || jobData });
    }

    if (req.method === "PATCH") {
      const targetId = body.id || jobId;
      if (!targetId) {
        return res.status(400).json({ success: false, error: "Missing job id" });
      }

      const allowedFields = ["title", "description", "requirements", "location", "department", "salary", "status"];
      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }

      let query = sb.from("jobs").update(updates).eq("id", targetId);
      if (effectiveUserId !== "admin-001") {
        query = query.eq("user_id", effectiveUserId);
      }

      const { data, error } = await query.select().maybeSingle();
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, job: data });
    }

    if (req.method === "DELETE") {
      const targetId = jobId || body.id;
      if (!targetId) {
        return res.status(400).json({ success: false, error: "Missing job id" });
      }

      let query = sb.from("jobs").delete().eq("id", targetId);
      if (effectiveUserId !== "admin-001") {
        query = query.eq("user_id", effectiveUserId);
      }

      const { error } = await query;
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.status(200).json({ success: true, message: "Job deleted successfully" });
    }

    return res.status(405).json({ success: false, error: "Method Not Allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

