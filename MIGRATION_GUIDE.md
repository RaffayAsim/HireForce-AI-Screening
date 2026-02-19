# Database Migration Guide - Add user_id Columns for Data Isolation

## Overview
This migration adds the `user_id` column to both `jobs` and `candidates` tables to enable data isolation between trial users. Each trial user will only see their own jobs and candidates.

## What's Being Added
- `user_id` TEXT column on `jobs` table
- `user_id` TEXT column on `candidates` table
- Index on `jobs.user_id` for performance
- Index on `candidates.user_id` for performance

## Steps to Apply Migration

### 1. Go to Supabase Dashboard
- Navigate to your Supabase project at https://app.supabase.com
- Click on your project: **calm-penguin-blink**

### 2. Go to SQL Editor
- In the left sidebar, click on **"SQL Editor"**
- Click the **"New Query"** button

### 3. Copy and Paste the SQL

Copy this entire SQL script into the query editor:

```sql
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
```

### 4. Execute the Query
- Click the **"▶ Send"** button or press `Ctrl+Enter`
- Wait for the query to complete (should be instant)
- You should see a success message

### 5. Verify the Changes
Run this verification query in a new SQL Editor tab:

```sql
-- Check jobs table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

-- Check candidates table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'candidates' 
ORDER BY ordinal_position;
```

You should see `user_id` in both tables.

## What Happens After Migration

### For New Users (Trial or Paid):
- When a user creates a job, their `user_id` is automatically stored with the job
- When a candidate applies, their `user_id` is automatically stored
- Users only see jobs and candidates with their own `user_id`

### Data Isolation:
- Trial User 1 creates Job A → Only Trial User 1 sees Job A
- Trial User 2 creates Job B → Only Trial User 2 sees Job B
- Candidates applying to Job A → Only visible to Trial User 1

### Backward Compatibility:
- Existing jobs and candidates without `user_id` will be accessible by all users (until `user_id` is populated)
- New entries will have the `user_id` set automatically

## Troubleshooting

### If you get error: "column already exists"
- This is fine! The `IF NOT EXISTS` clause prevents this. Just run the query again.

### If migration doesn't take effect
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Restart the dev server

### To verify data was saved correctly
```sql
SELECT id, title, user_id FROM public.jobs LIMIT 10;
SELECT id, full_name, user_id FROM public.candidates LIMIT 10;
```

## Application Changes Made

The app now:
1. ✅ Passes `userId` to all API calls
2. ✅ Filters jobs and candidates by `user_id`
3. ✅ Gracefully handles missing `user_id` column (fallback to all data)
4. ✅ Automatically tags new jobs/candidates with the user's ID

## Timeline

- **Before Migration**: All users see all jobs (no data isolation)
- **After Migration**: Each user sees only their own jobs and candidates

---

Need help? Check the console logs for detailed error messages!
