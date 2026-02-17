-- Add phone and status columns to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';