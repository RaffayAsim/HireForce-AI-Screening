-- ==============================================================================
-- Supabase Tenant Plans & Free Trial Enforcement
-- Service-role only, RLS enabled, zero anon access
-- ==============================================================================

-- 1. Create tenant_plans table
CREATE TABLE IF NOT EXISTS public.tenant_plans (
  tenant_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free_trial',
  screening_limit INTEGER NOT NULL DEFAULT 10,
  screenings_used INTEGER NOT NULL DEFAULT 0,
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.tenant_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_tenant_plans_all" ON public.tenant_plans;
CREATE POLICY "service_role_tenant_plans_all"
ON public.tenant_plans FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "No anon access to tenant_plans" ON public.tenant_plans;
CREATE POLICY "No anon access to tenant_plans"
ON public.tenant_plans FOR ALL
TO public
USING (false);

-- 3. Atomic check & increment SQL RPC function
-- Ensures ACID concurrency safety: two simultaneous applications cannot take the 10th slot.
CREATE OR REPLACE FUNCTION public.increment_screening_usage(p_tenant_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_limit INT;
  v_used INT;
BEGIN
  -- Ensure row exists (default to free_trial, limit 10, used 0)
  INSERT INTO public.tenant_plans (tenant_id, plan, screening_limit, screenings_used, trial_started_at, updated_at)
  VALUES (p_tenant_id, 'free_trial', 10, 0, NOW(), NOW())
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Atomic update: only increment if NOT free_trial OR screenings_used < screening_limit
  UPDATE public.tenant_plans
  SET screenings_used = screenings_used + 1,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND (plan <> 'free_trial' OR screenings_used < screening_limit)
  RETURNING plan, screening_limit, screenings_used INTO v_plan, v_limit, v_used;

  IF FOUND THEN
    RETURN json_build_object(
      'allowed', true,
      'plan', v_plan,
      'screening_limit', v_limit,
      'screenings_used', v_used
    );
  ELSE
    SELECT plan, screening_limit, screenings_used INTO v_plan, v_limit, v_used
    FROM public.tenant_plans
    WHERE tenant_id = p_tenant_id;

    RETURN json_build_object(
      'allowed', false,
      'plan', COALESCE(v_plan, 'free_trial'),
      'screening_limit', COALESCE(v_limit, 10),
      'screenings_used', COALESCE(v_used, 10)
    );
  END IF;
END;
$$;

-- 4. Seed / migrate existing tenants as Pro (unlimited)
INSERT INTO public.tenant_plans (tenant_id, plan, screening_limit, screenings_used)
VALUES
  ('tenant-1793401234436', 'pro', 999999, 0),
  ('tenant-1793454686703', 'pro', 999999, 0),
  ('admin-001', 'pro', 999999, 0)
ON CONFLICT (tenant_id) DO UPDATE SET
  plan = 'pro',
  screening_limit = 999999;
