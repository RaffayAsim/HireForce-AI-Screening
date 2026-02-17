# HireFlow Intelligence

AI-powered recruitment platform built with React, TypeScript, and Supabase.

## Features

- **Job Management**: Create and manage job openings stored in Supabase PostgreSQL
- **Candidate Applications**: Applicants can submit resumes via application forms
- **AI Screening**: n8n integration for automated resume screening with detailed summaries
- **Real-time Updates**: Live dashboard updates when n8n processes candidates
- **Resume Storage**: PDF resumes stored in Supabase Storage with public URLs
- **AI Screening Summaries**: Detailed analysis from n8n displayed for each candidate

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Storage)
- React Router
- n8n (for AI processing)

## Environment Variables

Create a `.env` file:

```env
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
```

## Database Schema

### Jobs Table
- `id` (UUID, primary key)
- `title` (text)
- `description` (text)
- `requirements` (text)
- `location` (text)
- `department` (text)
- `salary` (text)
- `status` (text)
- `created_at` (timestamp)

### Candidates Table
- `id` (UUID, primary key)
- `full_name` (text)
- `email` (text)
- `linkedin` (text)
- `job_id` (UUID, foreign key to jobs)
- `resume_url` (text)
- `screening_score` (integer, nullable)
- `screening_summary` (text, nullable) - **NEW: Detailed AI analysis from n8n**
- `created_at` (timestamp)

### Storage
- Bucket: `resumes`
- Public access enabled for resume viewing

## n8n Webhook Format

When a candidate applies, the app sends:

```json
{
  "candidateId": "uuid",
  "jobId": "uuid", 
  "resumeUrl": "https://...",
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com"
}
```

### Expected n8n Response/Update

n8n should update the candidate record in Supabase with:

```json
{
  "screening_score": 85,
  "screening_summary": "Strong candidate with 5+ years React experience. Excellent communication skills demonstrated. Matches 90% of job requirements. Recommendation: Proceed to interview stage."
}
```

**Note**: Both `screening_score` (integer 0-100) and `screening_summary` (text) should be updated by n8n after AI analysis.