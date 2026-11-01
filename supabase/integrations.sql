-- Supabase Integrations Table & Migration
-- Service-role only, RLS enabled, no anon access

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'zoho')),
  service TEXT NOT NULL CHECK (service IN ('calendar', 'mail', 'meeting')),
  connection_id TEXT NOT NULL,
  account_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_tenant_provider_service UNIQUE (tenant_id, provider, service)
);

-- Enable RLS and restrict anon access
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No anon access to integrations" ON public.integrations;
CREATE POLICY "No anon access to integrations" ON public.integrations
  FOR ALL TO public USING (false);

-- Migration for tenant-1793401234436 (R1: Google, raffay.asim6@gmail.com)
INSERT INTO public.integrations (tenant_id, provider, service, connection_id, account_email)
VALUES
  ('tenant-1793401234436', 'google', 'calendar', '132806be-8d06-4b3f-a45a-75e4009e9714', 'raffay.asim6@gmail.com'),
  ('tenant-1793401234436', 'google', 'mail', 'b7ea940c-efcc-47c0-9247-31ece8ca7eb0', 'raffay.asim6@gmail.com'),
  ('tenant-1793401234436', 'google', 'meeting', '132806be-8d06-4b3f-a45a-75e4009e9714', 'raffay.asim6@gmail.com')
ON CONFLICT (tenant_id, provider, service) DO UPDATE SET
  connection_id = EXCLUDED.connection_id,
  account_email = EXCLUDED.account_email,
  updated_at = NOW();

