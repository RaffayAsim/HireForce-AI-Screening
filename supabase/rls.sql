-- 1. Dynamically drop all legacy / existing policies on candidates, jobs, and interviews
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('candidates', 'jobs', 'interviews', 'tenant_routing_registry', 'superadmins')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- 3. Candidates: Strict server-side access only via service_role (Anon gets ZERO access)
CREATE POLICY "service_role_candidates_all" 
ON candidates FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 4. Jobs: Public anon can ONLY view open/active jobs; service_role has full access
CREATE POLICY "anon_jobs_select_open" 
ON jobs FOR SELECT 
TO anon 
USING (status IN ('open', 'Active', 'active'));

CREATE POLICY "service_role_jobs_all" 
ON jobs FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 5. Interviews: Strict server-side access only via service_role
CREATE POLICY "service_role_interviews_all" 
ON interviews FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 6. Additional tables if present
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_routing_registry') THEN
    ALTER TABLE tenant_routing_registry ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "service_role_tenant_registry_all" ON tenant_routing_registry FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'superadmins') THEN
    ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "service_role_superadmins_all" ON superadmins FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
