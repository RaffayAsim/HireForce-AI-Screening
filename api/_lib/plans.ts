import { createClient } from "@supabase/supabase-js";

export interface TenantPlanInfo {
  tenant_id: string;
  plan: string;
  screening_limit: number;
  screenings_used: number;
  is_trial: boolean;
  trial_started_at?: string;
  updated_at?: string;
}

export interface IncrementResult {
  allowed: boolean;
  plan: string;
  screening_limit: number;
  screenings_used: number;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://fobfgvmwfzoxzzcheusm.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIxMzE2MCwiZXhwIjoyMTA4Nzg5MTYwfQ.WwWjdxSzQTdWIeMzb8HrtA6mTlB595mUEn_0M8zVWCE";
const sb = createClient(supabaseUrl, supabaseKey);

// Seed unlimited tenants
const PRO_TENANTS = new Set([
  "tenant-1793401234436",
  "tenant-1793454686703",
  "admin-001",
]);

// In-process tenant mutex locks to serialize concurrent operations per tenant
const tenantLocks = new Map<string, Promise<void>>();
async function withTenantLock<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  const currentLock = tenantLocks.get(tenantId) || Promise.resolve();
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => { release = resolve; });
  tenantLocks.set(tenantId, currentLock.then(() => nextLock));
  await currentLock;
  try {
    return await fn();
  } finally {
    release!();
  }
}

// In-memory fallback cache
const memoryPlans = new Map<string, { plan: string; limit: number; used: number }>();

// Fallback persistence using candidates table under isolated user_id: 'sys_tenant_plan'
async function getFallbackPlanRecord(tenantId: string): Promise<{ plan: string; limit: number; used: number }> {
  if (PRO_TENANTS.has(tenantId)) {
    return { plan: "pro", limit: 999999, used: 0 };
  }

  const recordId = `plan-${tenantId}`;
  try {
    const { data, error } = await sb
      .from("candidates")
      .select("*")
      .eq("id", recordId)
      .eq("user_id", "sys_tenant_plan")
      .maybeSingle();

    if (!error && data && data.screening_summary) {
      try {
        const parsed = JSON.parse(data.screening_summary);
        return {
          plan: parsed.plan || data.status || "free_trial",
          limit: Number(parsed.screening_limit) || 10,
          used: Number(data.screening_score) || Number(parsed.screenings_used) || 0,
        };
      } catch {}
    }
  } catch {}

  const mem = memoryPlans.get(tenantId);
  if (mem) return mem;

  return { plan: "free_trial", limit: 10, used: 0 };
}

async function saveFallbackPlanRecord(tenantId: string, plan: string, limit: number, used: number): Promise<void> {
  memoryPlans.set(tenantId, { plan, limit, used });
  const recordId = `plan-${tenantId}`;
  try {
    const summary = JSON.stringify({
      tenant_id: tenantId,
      plan,
      screening_limit: limit,
      screenings_used: used,
      updated_at: new Date().toISOString(),
    });

    const { data: existing } = await sb
      .from("candidates")
      .select("id")
      .eq("id", recordId)
      .eq("user_id", "sys_tenant_plan")
      .maybeSingle();

    if (existing) {
      await sb
        .from("candidates")
        .update({
          status: plan,
          screening_score: used,
          screening_summary: summary,
        })
        .eq("id", recordId)
        .eq("user_id", "sys_tenant_plan");
    } else {
      await sb.from("candidates").insert({
        id: recordId,
        full_name: tenantId,
        email: "tenant_plan@system.local",
        user_id: "sys_tenant_plan",
        status: plan,
        screening_score: used,
        screening_summary: summary,
      });
    }
  } catch {}
}

export async function getTenantPlan(tenantId: string): Promise<TenantPlanInfo> {
  if (!tenantId) {
    return {
      tenant_id: "",
      plan: "free_trial",
      screening_limit: 10,
      screenings_used: 0,
      is_trial: true,
    };
  }

  if (PRO_TENANTS.has(tenantId)) {
    return {
      tenant_id: tenantId,
      plan: "pro",
      screening_limit: 999999,
      screenings_used: 0,
      is_trial: false,
    };
  }

  // 1. Try querying tenant_plans table
  try {
    const { data, error } = await sb
      .from("tenant_plans")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!error && data) {
      return {
        tenant_id: data.tenant_id,
        plan: data.plan || "free_trial",
        screening_limit: Number(data.screening_limit) ?? 10,
        screenings_used: Number(data.screenings_used) ?? 0,
        is_trial: data.plan === "free_trial",
        trial_started_at: data.trial_started_at,
        updated_at: data.updated_at,
      };
    }

    if (!error && !data) {
      // Row doesn't exist yet, insert default
      const { data: newRow, error: insErr } = await sb
        .from("tenant_plans")
        .insert({
          tenant_id: tenantId,
          plan: "free_trial",
          screening_limit: 10,
          screenings_used: 0,
        })
        .select()
        .maybeSingle();

      if (!insErr && newRow) {
        return {
          tenant_id: newRow.tenant_id,
          plan: newRow.plan,
          screening_limit: Number(newRow.screening_limit),
          screenings_used: Number(newRow.screenings_used),
          is_trial: newRow.plan === "free_trial",
          trial_started_at: newRow.trial_started_at,
          updated_at: newRow.updated_at,
        };
      }
    }
  } catch {}

  // 2. Fallback record
  const fb = await getFallbackPlanRecord(tenantId);
  return {
    tenant_id: tenantId,
    plan: fb.plan,
    screening_limit: fb.limit,
    screenings_used: fb.used,
    is_trial: fb.plan === "free_trial",
  };
}

export async function incrementScreeningUsage(tenantId: string): Promise<IncrementResult> {
  if (!tenantId) {
    return { allowed: false, plan: "free_trial", screening_limit: 10, screenings_used: 10 };
  }

  if (PRO_TENANTS.has(tenantId)) {
    return { allowed: true, plan: "pro", screening_limit: 999999, screenings_used: 0 };
  }

  return withTenantLock(tenantId, async () => {
    // 1. Try single SQL RPC in Supabase (PostgreSQL row-level lock)
    try {
      const { data, error } = await sb.rpc("increment_screening_usage", { p_tenant_id: tenantId });
      if (!error && data && typeof data === "object") {
        return {
          allowed: Boolean(data.allowed),
          plan: data.plan || "free_trial",
          screening_limit: Number(data.screening_limit) || 10,
          screenings_used: Number(data.screenings_used) || 0,
        };
      }
    } catch {}

    // 2. Try atomic check and update on tenant_plans table directly
    try {
      const { data: row, error: fetchErr } = await sb
        .from("tenant_plans")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!fetchErr) {
        let plan = row?.plan || "free_trial";
        let limit = Number(row?.screening_limit) || 10;
        let used = Number(row?.screenings_used) || 0;

        if (!row) {
          await sb.from("tenant_plans").insert({
            tenant_id: tenantId,
            plan: "free_trial",
            screening_limit: 10,
            screenings_used: 0,
          });
        }

        if (plan === "free_trial" && used >= limit) {
          return { allowed: false, plan, screening_limit: limit, screenings_used: used };
        }

        const nextUsed = used + 1;
        const { data: updated, error: updateErr } = await sb
          .from("tenant_plans")
          .update({ screenings_used: nextUsed, updated_at: new Date().toISOString() })
          .eq("tenant_id", tenantId)
          .select()
          .maybeSingle();

        if (!updateErr && updated) {
          return {
            allowed: true,
            plan: updated.plan,
            screening_limit: Number(updated.screening_limit),
            screenings_used: Number(updated.screenings_used),
          };
        }
      }
    } catch {}

    // 3. Fallback persistent record check & update
    const fb = await getFallbackPlanRecord(tenantId);
    if (fb.plan === "free_trial" && fb.used >= fb.limit) {
      return { allowed: false, plan: fb.plan, screening_limit: fb.limit, screenings_used: fb.used };
    }

    const newUsed = fb.used + 1;
    await saveFallbackPlanRecord(tenantId, fb.plan, fb.limit, newUsed);

    return {
      allowed: true,
      plan: fb.plan,
      screening_limit: fb.limit,
      screenings_used: newUsed,
    };
  });
}
