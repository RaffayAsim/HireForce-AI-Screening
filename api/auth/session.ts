import { createClient } from "@supabase/supabase-js";
import { createSessionToken, verifyAuth, hashPassword, verifyPassword } from "../_lib/auth.js";

// Rate limiting in-memory map: key -> { count, firstAttempt }
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

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

    // Rate limiting: 10 attempts per 15 min per IP / email
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "ip";
    const rateKey = `${ip}_${normalizedEmail}`;
    const now = Date.now();
    const rateInfo = loginAttempts.get(rateKey);

    if (rateInfo) {
      if (now - rateInfo.firstAttempt < 15 * 60 * 1000) {
        if (rateInfo.count >= 10) {
          return res.status(429).json({ success: false, error: "Too many login attempts. Please try again in 15 minutes." });
        }
      } else {
        loginAttempts.set(rateKey, { count: 0, firstAttempt: now });
      }
    } else {
      loginAttempts.set(rateKey, { count: 0, firstAttempt: now });
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
          id: seed.tenant_id,
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
        const rInfo = loginAttempts.get(rateKey);
        if (rInfo) rInfo.count++;
        return res.status(401).json({ success: false, error: "Invalid email or password" });
      }

      // 3. Verify password
      if (recruiter.password_hash) {
        const isValid = verifyPassword(password, recruiter.password_hash);
        if (!isValid) {
          const rInfo = loginAttempts.get(rateKey);
          if (rInfo) rInfo.count++;
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
      loginAttempts.delete(rateKey);

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
      try {
        const { data: existing } = await sb.from("recruiters").select("id").eq("email", normalizedEmail).maybeSingle();
        if (existing) {
          return res.status(409).json({ success: false, error: "An account with this email already exists" });
        }
      } catch {}

      const newTenantId = `tenant-${Date.now()}`;
      const hash = hashPassword(password);
      const newRecruiter = {
        id: newTenantId,
        email: normalizedEmail,
        password_hash: hash,
        tenant_id: newTenantId,
        name: name ? String(name).trim() : "Recruiter",
        company: company ? String(company).trim() : "Hiring Workspace",
      };

      try {
        await sb.from("recruiters").insert(newRecruiter);
      } catch (insErr) {
        console.warn("DB insert recruiter error:", insErr);
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
