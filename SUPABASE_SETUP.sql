-- Add phone and status columns to candidates table
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Add user_id column to jobs table for data isolation
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add user_id column to candidates table for data isolation
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON public.candidates(user_id);