# Supabase Database Setup Guide

## Required Columns for Candidates Table

Your app now uses two fields that need to be added to the Supabase database:

1. **phone** - Stores candidate's phone number
2. **status** - Stores HR screening status (new, good, waiting, rejected, hired)

## SQL Migration Script

Run this SQL in your Supabase SQL Editor to add both columns:

```sql
-- Add phone number column to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add status column to candidates table with default value
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Add comment to document the status options
COMMENT ON COLUMN public.candidates.status IS 'HR screening status: new, good, waiting, rejected, hired';

-- Add comment for phone column
COMMENT ON COLUMN public.candidates.phone IS 'Candidate phone number';
```

## Verify the Setup

After running the SQL, verify your table structure with:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidates' 
ORDER BY ordinal_position;
```

## Expected Columns

Your `candidates` table should now have these columns:
- `id` (uuid) - Primary key
- `full_name` (text) - Candidate name
- `email` (text) - Email address
- **phone** (text) - Phone number ⭐ NEW
- **status** (text) - Screening status ⭐ NEW
- `linkedin` (text) - LinkedIn URL
- `job_id` (uuid) - Foreign key to jobs
- `resume_url` (text) - Resume file URL
- `screening_score` (integer) - AI match score
- `screening_summary` (text) - AI analysis summary
- `created_at` (timestamp) - Application date

## Manual Data Update (Optional)

If you have existing candidates without status, run this to set them all to "new":

```sql
-- Set default status for existing candidates
UPDATE public.candidates 
SET status = 'new' 
WHERE status IS NULL;
```

## Row Level Security (RLS)

Ensure your RLS policies allow updating these fields. The existing policy should cover this, but verify:

```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'candidates';
```

The policy should allow authenticated users to update all columns.