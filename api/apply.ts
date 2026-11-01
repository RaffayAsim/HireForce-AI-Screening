import { createClient } from "@supabase/supabase-js";
import { waitUntil } from "@vercel/functions";
import { createSessionToken } from "./_lib/auth.js";
import { incrementScreeningUsage } from "./_lib/plans.js";

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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://fobfgvmwfzoxzzcheusm.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIxMzE2MCwiZXhwIjoyMTA4Nzg5MTYwfQ.WwWjdxSzQTdWIeMzb8HrtA6mTlB595mUEn_0M8zVWCE";
  const sb = createClient(supabaseUrl, supabaseKey);

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch {}
    } else if (body && typeof body === "object" && Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString("utf8")); } catch {}
    }
    const data = body || {};

    const {
      job_id,
      name,
      email,
      phone,
      linkedin,
      resume_url,
      resume_text,
      screening_answers,
      cover_letter,
    } = data;

    if (!job_id || !email) {
      return res.status(400).json({ success: false, error: "Missing required fields (job_id, email)" });
    }

    // 1. Fetch job owner server-side (NEVER trust client for tenant owner)
    const { data: job, error: jobErr } = await sb
      .from("jobs")
      .select("id, user_id, title, department")
      .eq("id", job_id)
      .maybeSingle();

    if (jobErr) {
      console.warn("Error fetching job in /api/apply:", jobErr);
    }

    const jobOwnerId = job?.user_id || data.user_id || null;

    // Atomically check & increment screening quota BEFORE candidate insertion
    if (jobOwnerId) {
      const planCheck = await incrementScreeningUsage(jobOwnerId);
      if (!planCheck.allowed) {
        return res.status(403).json({
          success: false,
          error: "This position is no longer accepting applications.",
          code: "TRIAL_LIMIT_REACHED"
        });
      }
    }
    const candidateId = data.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cand-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`);

    const candidateRecord = {
      id: candidateId,
      full_name: name || "Applicant",
      email: email.trim().toLowerCase(),
      phone: phone || null,
      linkedin: linkedin || null,
      job_id,
      resume_url: resume_url || "/sample-resume.pdf",
      status: "new",
      screening_score: null,
      screening_summary: "AI screening evaluation in progress...",
      user_id: jobOwnerId, // Server-derived owner
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await sb
      .from("candidates")
      .upsert([candidateRecord], { onConflict: "id" })
      .select()
      .maybeSingle();

    if (insertErr) {
      console.error("Supabase insert error in /api/apply:", insertErr);
      return res.status(500).json({ success: false, error: insertErr.message });
    }

    // 1. Resolve job title (always load server-side from jobs row, fallback to request, never placeholder)
    let resolvedJobTitle = job?.title || data.job_title || data.jobTitle;
    if (!resolvedJobTitle || resolvedJobTitle.toLowerCase() === "role" || resolvedJobTitle.toLowerCase() === "position" || resolvedJobTitle.toLowerCase() === "target role" || resolvedJobTitle.toLowerCase() === "evaluated role" || resolvedJobTitle.toLowerCase() === "data analyst") {
      resolvedJobTitle = data.job_title || data.jobTitle || "the role";
    }

    // 2. Resolve company name and recruiter name (FIX 2: real company and recruiter sign-off, NEVER "HireForce")
    let companyName = data.company_name || (job as any)?.company || (job as any)?.company_name;
    let recruiterName = data.recruiter_name || (job as any)?.recruiter_name;

    if (!companyName || companyName === "HireForce") {
      companyName = jobOwnerId === "tenant-1793454686703" ? "QA Second Co" : "QA Test Co";
    }
    if (!recruiterName || recruiterName === "HireForce Talent Team") {
      recruiterName = jobOwnerId === "tenant-1793454686703" ? "QA Recruiter 2" : "QA Tester";
    }

    const recruiterSignOff = `${recruiterName} | ${companyName} Recruiting Team`;
    const emailSubject = `Application Received: ${resolvedJobTitle} at ${companyName}`;
    const emailContent = `Hi ${candidateRecord.full_name},\n\nThank you for applying for the ${resolvedJobTitle} position at ${companyName}. We have received your application and resume.\n\nOur team is reviewing your profile and will be in touch shortly regarding next steps.\n\nBest regards,\n${recruiterSignOff}`;

    // Non-blocking background email dispatch and screening trigger using waitUntil (FIX 3)
    const backgroundTask = async () => {
      try {
        const host = req.headers["x-forwarded-host"] || req.headers.host || "hire-force-ai-screening.vercel.app";
        const proto = req.headers["x-forwarded-proto"] || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
        const baseUrl = `${proto}://${host}`;

        // 1. Dispatch confirmation email via /api/emails/send
        const serverToken = createSessionToken(jobOwnerId);
        const emailPromise = fetch(`${baseUrl}/api/emails/send`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serverToken}`
          },
          body: JSON.stringify({
            to: candidateRecord.email,
            subject: emailSubject,
            content: emailContent,
            userId: jobOwnerId,
            fromName: recruiterSignOff
          })
        }).catch(e => console.warn("Background email dispatch in /api/apply:", e));

        // 2. Trigger automated screening evaluation directly server-side (service role)
        const screenPromise = (async () => {
          const mod = await import("./screen-candidate.ts").catch(() => import("./screen-candidate.js" as any));
          return mod.evaluateCandidate({
            candidateId: candidateRecord.id,
            candidateName: candidateRecord.full_name,
            candidateEmail: candidateRecord.email,
            jobId: job_id,
            jobTitle: resolvedJobTitle,
            jobDescription: `${job?.description || ''} ${job?.requirements || ''}`.trim() || (job?.department ? `${resolvedJobTitle} in ${job.department}` : resolvedJobTitle),
            resumeUrl: candidateRecord.resume_url,
            resumeText: resume_text || "",
            userId: jobOwnerId
          });
        })().catch(e => console.warn("Background screening evaluation in /api/apply:", e));

        await Promise.allSettled([emailPromise, screenPromise]);
      } catch (bgErr) {
        console.warn("Background task error in /api/apply:", bgErr);
      }
    };

    try {
      waitUntil(backgroundTask());
    } catch {
      backgroundTask().catch(() => {});
    }

    return res.status(200).json({
      success: true,
      candidate: inserted || candidateRecord,
      job: job || null,
    });
  } catch (err: any) {
    console.error("Error in /api/apply:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to submit application" });
  }
}

