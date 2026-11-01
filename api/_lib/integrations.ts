import { createClient } from "@supabase/supabase-js";

export interface IntegrationRow {
  id?: string;
  tenant_id: string;
  provider: "google" | "microsoft" | "zoho";
  service: "calendar" | "mail" | "meeting";
  connection_id: string;
  account_email: string;
  created_at?: string;
  updated_at?: string;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://fobfgvmwfzoxzzcheusm.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzIxMzE2MCwiZXhwIjoyMTA4Nzg5MTYwfQ.WwWjdxSzQTdWIeMzb8HrtA6mTlB595mUEn_0M8zVWCE";
const sb = createClient(supabaseUrl, supabaseKey);

// In-memory cache for fast lookups across function invocations
const memoryIntegrations = new Map<string, IntegrationRow>();

export async function getIntegrations(tenantId: string): Promise<IntegrationRow[]> {
  if (!tenantId) return [];

  try {
    const { data, error } = await sb
      .from("integrations")
      .select("*")
      .eq("tenant_id", tenantId);

    if (!error && Array.isArray(data) && data.length > 0) {
      // cache in memory
      for (const row of data as IntegrationRow[]) {
        const key = `${row.tenant_id}:${row.provider}:${row.service}`;
        memoryIntegrations.set(key, row);
      }
      return data as IntegrationRow[];
    }
  } catch {}

  // Fallback to memory map if query fails
  const results: IntegrationRow[] = [];
  for (const [_, val] of memoryIntegrations.entries()) {
    if (val.tenant_id === tenantId) {
      results.push(val);
    }
  }
  return results;
}

export async function getIntegration(
  tenantId: string,
  provider: "google" | "microsoft" | "zoho",
  service: "calendar" | "mail" | "meeting"
): Promise<IntegrationRow | null> {
  if (!tenantId) return null;

  try {
    const { data, error } = await sb
      .from("integrations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("provider", provider)
      .eq("service", service)
      .maybeSingle();

    if (!error && data) {
      const row = data as IntegrationRow;
      const key = `${tenantId}:${provider}:${service}`;
      memoryIntegrations.set(key, row);
      return row;
    }
  } catch {}

  const key = `${tenantId}:${provider}:${service}`;
  return memoryIntegrations.get(key) || null;
}

export async function getIntegrationForService(
  tenantId: string,
  service: "calendar" | "mail" | "meeting"
): Promise<IntegrationRow | null> {
  if (!tenantId) return null;

  try {
    const { data, error } = await sb
      .from("integrations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("service", service);

    if (!error && Array.isArray(data) && data.length > 0) {
      for (const row of data as IntegrationRow[]) {
        const key = `${row.tenant_id}:${row.provider}:${row.service}`;
        memoryIntegrations.set(key, row);
      }
      return data[0] as IntegrationRow;
    }
  } catch {}

  for (const [_, val] of memoryIntegrations.entries()) {
    if (val.tenant_id === tenantId && val.service === service) {
      return val;
    }
  }
  return null;
}

export async function saveIntegration(
  tenantId: string,
  provider: "google" | "microsoft" | "zoho",
  service: "calendar" | "mail" | "meeting",
  connectionId: string,
  accountEmail: string
): Promise<IntegrationRow> {
  const row: IntegrationRow = {
    tenant_id: tenantId,
    provider,
    service,
    connection_id: connectionId,
    account_email: accountEmail,
    updated_at: new Date().toISOString(),
  };

  const key = `${tenantId}:${provider}:${service}`;
  memoryIntegrations.set(key, row);

  try {
    await sb
      .from("integrations")
      .upsert(
        {
          tenant_id: tenantId,
          provider,
          service,
          connection_id: connectionId,
          account_email: accountEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,provider,service" }
      );
  } catch {}

  return row;
}

export async function deleteIntegration(
  tenantId: string,
  provider?: string,
  service?: string
): Promise<void> {
  if (!tenantId) return;

  // Clear from memory map
  for (const [key, val] of memoryIntegrations.entries()) {
    if (val.tenant_id === tenantId) {
      if ((!provider || val.provider === provider) && (!service || val.service === service)) {
        memoryIntegrations.delete(key);
      }
    }
  }

  try {
    let query = sb.from("integrations").delete().eq("tenant_id", tenantId);
    if (provider) query = query.eq("provider", provider);
    if (service) query = query.eq("service", service);
    await query;
  } catch {}
}
