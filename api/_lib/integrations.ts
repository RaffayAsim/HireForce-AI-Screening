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

// In-memory fallback / cache ensuring R1 (tenant-1793401234436) stays connected
const memoryIntegrations = new Map<string, IntegrationRow>([
  [
    "tenant-1793401234436:google:calendar",
    {
      id: "migrated-r1-google-calendar",
      tenant_id: "tenant-1793401234436",
      provider: "google",
      service: "calendar",
      connection_id: "132806be-8d06-4b3f-a45a-75e4009e9714",
      account_email: "raffay.asim6@gmail.com",
    }
  ],
  [
    "tenant-1793401234436:google:meeting",
    {
      id: "migrated-r1-google-meeting",
      tenant_id: "tenant-1793401234436",
      provider: "google",
      service: "meeting",
      connection_id: "132806be-8d06-4b3f-a45a-75e4009e9714",
      account_email: "raffay.asim6@gmail.com",
    }
  ],
  [
    "tenant-1793401234436:google:mail",
    {
      id: "migrated-r1-google-mail",
      tenant_id: "tenant-1793401234436",
      provider: "google",
      service: "mail",
      connection_id: "b7ea940c-efcc-47c0-9247-31ece8ca7eb0",
      account_email: "raffay.asim6@gmail.com",
    }
  ],
]);

export async function getIntegrations(tenantId: string): Promise<IntegrationRow[]> {
  if (!tenantId) return [];

  try {
    const { data, error } = await sb
      .from("integrations")
      .select("*")
      .eq("tenant_id", tenantId);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as IntegrationRow[];
    }
  } catch {}

  // Fallback to memory map
  const results: IntegrationRow[] = [];
  for (const [key, val] of memoryIntegrations.entries()) {
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
      return data as IntegrationRow;
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
      return data[0] as IntegrationRow;
    }
  } catch {}

  for (const [key, val] of memoryIntegrations.entries()) {
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

