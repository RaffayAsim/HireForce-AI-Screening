-- 1. Create recruiters table
CREATE TABLE IF NOT EXISTS recruiters (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email text UNIQUE NOT NULL,
  password_hash text,
  tenant_id text NOT NULL,
  name text,
  company text,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS (Strict server-side service_role only, ZERO access for anon)
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_recruiters_all" ON recruiters;
CREATE POLICY "service_role_recruiters_all" 
ON recruiters FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 3. Seed / Migrate existing recruiter tenants
-- Default password: HireForce2024!
INSERT INTO recruiters (email, password_hash, tenant_id, name, company)
VALUES 
  ('hfqa209871@maxxspace.com', '59d76d7be341dd4b41d692765d5ca7ff:47c17cc3ffd709033718437b7f792eff52cf7fe5dcf1ec03ce4c26963cc8209e261e6be036c3b2dad10bdfc3dbf493859695ddeb20a25a0fda07dcef94dbe4de', 'tenant-1793401234436', 'QA Tester', 'QA Test Co'),
  ('q4rec2858070@fldubai.com', '59d76d7be341dd4b41d692765d5ca7ff:47c17cc3ffd709033718437b7f792eff52cf7fe5dcf1ec03ce4c26963cc8209e261e6be036c3b2dad10bdfc3dbf493859695ddeb20a25a0fda07dcef94dbe4de', 'tenant-1793454686703', 'QA Recruiter 2', 'QA Second Co')
ON CONFLICT (email) DO UPDATE SET 
  tenant_id = EXCLUDED.tenant_id,
  password_hash = COALESCE(recruiters.password_hash, EXCLUDED.password_hash),
  name = EXCLUDED.name,
  company = EXCLUDED.company;
