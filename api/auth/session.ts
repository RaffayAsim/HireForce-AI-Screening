import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createSessionToken, verifyAuth, hashPassword, verifyPassword } from "../_lib/auth.js";

// Database-backed rate limiting helpers (stores in login_attempts or sys_rate_limit)
async function getFailedAttempts(sb: any, key: string, windowMs = 15 * 60 * 1000): Promise<number> {
  if (!sb) return 0;
  const now = Date.now();
  // 1. Try login_attempts table if exists
  try {
    const { data, error } = await sb.from("login_attempts").select("*").eq("key", key).maybeSingle();
    if (!error && data) {
      if (now - Number(data.window_start) < windowMs) {
        return Number(data.count) || 0;
      }
      return 0;
    }
  } catch {}

  // 2. Fallback to candidates table (isolated under user_id: 'sys_rate_limit')
  try {
    const recordId = `rl-${crypto.createHash("md5").update(key).digest("hex")}`;
    const { data, error } = await sb.from("candidates").select("*").eq("id", recordId).eq("user_id", "sys_rate_limit").maybeSingle();
    if (!error && data && data.screening_summary) {
      try {
        const parsed = JSON.parse(data.screening_summary);
        if (now - Number(parsed.window_start) < windowMs) {
          return Number(parsed.count) || 0;
        }
      } catch {}
    }
  } catch {}

  return 0;
}

async function recordFailedAttempt(sb: any, key: string, windowMs = 15 * 60 * 1000): Promise<number> {
  if (!sb) return 1;
  const now = Date.now();
  // 1. Try login_attempts table
  try {
    const { data } = await sb.from("login_attempts").select("*").eq("key", key).maybeSingle();
    if (data) {
      let count = 1;
      let windowStart = now;
      if (now - Number(data.window_start) < windowMs) {
        count = (Number(data.count) || 0) + 1;
        windowStart = Number(data.window_start);
      }
      await sb.from("login_attempts").update({ count, window_start: windowStart }).eq("key", key);
      return count;
    } else {
      const { error } = await sb.from("login_attempts").insert({ key, count: 1, window_start: now });
      if (!error) return 1;
    }
  } catch {}

  // 2. Fallback to candidates table
  try {
    const recordId = `rl-${crypto.createHash("md5").update(key).digest("hex")}`;
    const { data } = await sb.from("candidates").select("*").eq("id", recordId).eq("user_id", "sys_rate_limit").maybeSingle();
    let count = 1;
    let windowStart = now;
    if (data && data.screening_summary) {
      try {
        const parsed = JSON.parse(data.screening_summary);
        if (now - Number(parsed.window_start) < windowMs) {
          count = (Number(parsed.count) || 0) + 1;
          windowStart = Number(parsed.window_start);
        }
      } catch {}
      await sb.from("candidates").update({
        screening_score: count,
        screening_summary: JSON.stringify({ count, window_start: windowStart })
      }).eq("id", recordId);
      return count;
    } else {
      await sb.from("candidates").insert({
        id: recordId,
        full_name: "Rate Limit Guard",
        email: "rl@system.local",
        user_id: "sys_rate_limit",
        screening_score: 1,
        screening_summary: JSON.stringify({ count: 1, window_start: now })
      });
      return 1;
    }
  } catch {}

  return 1;
}

async function clearFailedAttempts(sb: any, key: string): Promise<void> {
  if (!sb) return;
  try {
    await sb.from("login_attempts").delete().eq("key", key);
  } catch {}
  try {
    const recordId = `rl-${crypto.createHash("md5").update(key).digest("hex")}`;
    await sb.from("candidates").delete().eq("id", recordId).eq("user_id", "sys_rate_limit");
  } catch {}
}

const SEED_RECRUITERS = [
  {
    email: "hfqa209871@maxxspace.com",
    tenant_id: "tenant-1793401234436",
    name: "QA Tester",
    company: "QA Test Co",
    password_hash: "59d76d7be341dd4b41d692765d5ca7ff:47c17cc3ffd709033718437b7f792eff52cf7fe5dcf1ec03ce4c26963cc8209e261e6be036c3b2dad10bdfc3dbf493859695ddeb20a25a0fda07dcef94dbe4de", // HireForce2024!
  },
  {
    email: "q4rec2858070@fldubai.com",
    tenant_id: "tenant-1793454686703",
    name: "QA Recruiter 2",
    company: "QA Second Co",
    password_hash: "59d76d7be341dd4b41d692765d5ca7ff:47c17cc3ffd709033718437b7f792eff52cf7fe5dcf1ec03ce4c26963cc8209e261e6be036c3b2dad10bdfc3dbf493859695ddeb20a25a0fda07dcef94dbe4de", // HireForce2024!
  },
  {
    email: "admin@vision.ai",
    tenant_id: "admin-001",
    name: "Vision Admin",
    company: "Vision AI",
    password_hash: "59d76d7be341dd4b41d692765d5ca7ff:47c17cc3ffd709033718437b7f792eff52cf7fe5dcf1ec03ce4c26963cc8209e261e6be036c3b2dad10bdfc3dbf493859695ddeb20a25a0fda07dcef94dbe4de", // HireForce2024!
  }
];

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const action = req.query?.action || (req.url?.includes("/login") ? "login" : req.url?.includes("/signup") ? "signup" : "session");

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body || "{}"); } catch { body = {}; }
  } else if (body && typeof body === "object" && Buffer.isBuffer(body)) {
    try { body = JSON.parse(body.toString("utf8") || "{}"); } catch { body = {}; }
  } else if (!body) {
    body = {};
  }

  // ==========================================
  // ACTION: SESSION (TOKEN REFRESH & VALIDATION)
  // MUST NOT ACCEPT tenantId FROM BODY!
  // ==========================================
  if (action === "session") {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser || !authUser.tenantId) {
        return res.status(401).json({ success: false, error: "Unauthorized: Missing or invalid authentication token" });
      }

      // Refresh valid session token
      const token = createSessionToken(authUser.tenantId, 12);
      return res.status(200).json({
        success: true,
        token,
        tenantId: authUser.tenantId,
        userId: authUser.userId || authUser.tenantId,
        expiresIn: 12 * 3600
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://fobfgvmwfzoxzzcheusm.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIxMzE2MCwiZXhwIjoyMTA4Nzg5MTYwfQ.WwWjdxSzQTdWIeMzb8HrtA6mTlB595mUEn_0M8zVWCE";
  let sb: any = null;
  if (supabaseKey) {
    try {
      sb = createClient(supabaseUrl, supabaseKey);
    } catch {}
  }

  // ==========================================
  // ACTION 1: LOGIN
  // ==========================================
  if (action === "login") {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    const { email, password } = body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Database-backed rate limiting: 10 failed attempts per 15 min per IP and per email
    const rawIp = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "ip").split(",")[0].trim();
    const ipKey = `ip_${rawIp}`;
    const emailKey = `email_${normalizedEmail}`;

    const ipAttempts = await getFailedAttempts(sb, ipKey);
    const emailAttempts = await getFailedAttempts(sb, emailKey);
    if (ipAttempts >= 10 || emailAttempts >= 10) {
      return res.status(429).json({ success: false, error: "Too many login attempts. Please try again in 15 minutes." });
    }

    try {
      // 1. Fetch recruiter record from DB
      let recruiter: any = null;
      try {
        const { data, error } = await sb.from("recruiters").select("*").eq("email", normalizedEmail).maybeSingle();
        if (!error && data) {
          recruiter = data;
        }
      } catch {}

      // 2. Fallback to seed recruiter if table not populated or user migrating
      const seed = SEED_RECRUITERS.find(s => s.email === normalizedEmail);
      if (!recruiter && seed) {
        recruiter = {
          email: seed.email,
          password_hash: seed.password_hash,
          tenant_id: seed.tenant_id,
          name: seed.name,
          company: seed.company,
        };
        try {
          await sb.from("recruiters").insert(recruiter);
        } catch {}
      }

      if (!recruiter) {
        await recordFailedAttempt(sb, ipKey);
        await recordFailedAttempt(sb, emailKey);
        return res.status(401).json({ success: false, error: "Invalid email or password" });
      }

      // 3. Verify password
      if (recruiter.password_hash) {
        const isValid = verifyPassword(password, recruiter.password_hash);
        if (!isValid) {
          await recordFailedAttempt(sb, ipKey);
          await recordFailedAttempt(sb, emailKey);
          return res.status(401).json({ success: false, error: "Invalid email or password" });
        }
      } else {
        // First login: set password!
        const newHash = hashPassword(password);
        recruiter.password_hash = newHash;
        try {
          await sb.from("recruiters").update({ password_hash: newHash }).eq("email", normalizedEmail);
        } catch {}
      }

      // Reset failed attempts on success
      await clearFailedAttempts(sb, emailKey);
      await clearFailedAttempts(sb, ipKey);

      // Issue signed server token
      const tenantId = recruiter.tenant_id || recruiter.id;
      const token = createSessionToken(tenantId, 12);

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: tenantId,
          tenantId,
          email: recruiter.email,
          name: recruiter.name || "Recruiter",
          company: recruiter.company || "Company",
          userType: tenantId === "admin-001" ? "admin" : "pro",
        }
      });
    } catch (err: any) {
      console.error("Login endpoint error:", err);
      return res.status(500).json({ success: false, error: err.message || "Internal server error" });
    }
  }

  // ==========================================
  // ACTION 2: SIGNUP
  // ==========================================
  if (action === "signup") {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method Not Allowed" });
    }

    const { email, password, name, company } = body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    try {
      if (sb) {
        const { data: existing } = await sb.from("recruiters").select("id").eq("email", normalizedEmail).maybeSingle();
        if (existing) {
          return res.status(409).json({ success: false, error: "An account with this email already exists" });
        }
      }

      const newTenantId = `tenant-${Date.now()}`;
      const hash = hashPassword(password);
      const newRecruiter = {
        email: normalizedEmail,
        password_hash: hash,
        tenant_id: newTenantId,
        name: name ? String(name).trim() : "Recruiter",
        company: company ? String(company).trim() : "Hiring Workspace",
      };

      if (sb) {
        const { error: insErr } = await sb.from("recruiters").insert(newRecruiter);
        if (insErr) {
          if (insErr.code === "23505") { // unique constraint violation
            return res.status(409).json({ success: false, error: "An account with this email already exists" });
          }
          console.error("DB insert recruiter error:", insErr);
          return res.status(500).json({ success: false, error: "Failed to create recruiter account" });
        }
      }

      const token = createSessionToken(newTenantId, 12);
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: newTenantId,
          tenantId: newTenantId,
          email: normalizedEmail,
          name: newRecruiter.name,
          company: newRecruiter.company,
          userType: "trial",
        }
      });
    } catch (err: any) {
      console.error("Signup endpoint error:", err);
      return res.status(500).json({ success: false, error: err.message || "Signup failed" });
    }
  }

  return res.status(400).json({ success: false, error: "Invalid action" });
}
