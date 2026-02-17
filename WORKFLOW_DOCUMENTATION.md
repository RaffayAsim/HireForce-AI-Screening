# HireFlow Technical Workflow Documentation

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│  Supabase   │◀────│     n8n     │────▶│  AI/LLM     │
│   Frontend  │◀────│  PostgreSQL │     │  Automation │     │  Screening  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
        │                    │                   │
        │            ┌──────┴──────┐            │
        └────────────▶│   Storage   │◀───────────┘
                      │  (Resumes)  │
                      └─────────────┘
```

---

## 1. Job Posting Flow

### Step 1: Create Job (Frontend)
- **Location**: `CreateJobModal.tsx`
- User fills form: Title, Department, Salary, Description, Requirements
- On submit, `createJobInSupabase()` is called from `src/lib/api.ts`

### Step 2: Store in Supabase
```typescript
// Insert into 'jobs' table
{
  title: "Senior Product Designer",
  description: "Full job description...",
  requirements: "Must have 5+ years experience...",
  location: "Remote",
  department: "Design",
  salary: "$120k - $150k",
  status: "Active",
  created_at: "2024-01-15T10:30:00Z"
}
```

### Step 3: Generate Application Link
- Job ID (UUID) returned from Supabase
- Link generated: `https://yourdomain.com/apply/{jobId}`
- Link displayed to user for sharing

### Step 4: Real-time Update
- `subscribeToJobs()` listens for PostgreSQL changes
- Dashboard updates instantly when new job created

---

## 2. Candidate Application Flow

### Step 1: Access Application Page
- Candidate visits `/apply/{jobId}`
- `fetchJobById()` retrieves job details from Supabase
- Job title and screening questions displayed

### Step 2: Form Submission
- **Location**: `Apply.tsx`
- Candidate submits:
  - Full Name
  - Email
  - LinkedIn URL
  - Answers to screening questions (if configured)
  - Resume PDF file

### Step 3: Resume Upload
```typescript
// Upload to Supabase Storage
const filePath = `resumes/${candidate-name}-${timestamp}.pdf`
await supabase.storage.from('resumes').upload(filePath, file)
const { publicUrl } = supabase.storage.from('resumes').getPublicUrl(filePath)
```

### Step 4: Create Candidate Record
```typescript
// Insert into 'candidates' table
{
  full_name: "John Doe",
  email: "john@example.com",
  linkedin: "linkedin.com/in/johndoe",
  job_id: "uuid-of-job",           // Foreign key to jobs table
  resume_url: "https://...",       // Public URL from Storage
  screening_score: null,           // Will be filled by n8n
  screening_summary: null,         // Will be filled by n8n with AI analysis
  created_at: "2024-01-15T14:20:00Z"
}
```

### Step 5: Real-time Update
- `subscribeToCandidates()` triggers immediately
- Candidate appears in dashboard with "Analyzing..." status

---

## 3. n8n Integration

### Webhook Trigger
When candidate application is saved, `sendToN8n()` is called:

```typescript
POST https://jamesy982.app.n8n.cloud/webhook/resume-screening
{
  "candidateId": "uuid-candidate-id",
  "jobId": "uuid-job-id",
  "resumeUrl": "https://supabase.co/storage/v1/object/public/resumes/...",
  "candidateName": "John Doe",
  "candidateEmail": "john@example.com"
}
```

### n8n Workflow (Expected Setup)

```mermaid
1. Webhook Trigger (resume-screening)
   │
   ├──▶ 2. Download Resume (HTTP Request)
   │      GET {resumeUrl}
   │
   ├──▶ 3. Parse Resume (PDF to Text)
   │
   ├──▶ 4. AI Screening (OpenAI/Claude)
   │      Prompt: "Analyze this candidate and provide:
   │      1. Score 0-100
   │      2. Detailed summary of strengths/weaknesses"
   │
   └──▶ 5. Update Supabase (PostgreSQL node)
          UPDATE candidates 
          SET screening_score = {ai_score},
              screening_summary = {ai_detailed_analysis}
          WHERE id = {candidateId}
```

### Expected n8n Output Format

n8n should update the Supabase record with both fields:

```json
{
  "screening_score": 87,
  "screening_summary": "Strong technical background with 6 years of React and TypeScript experience. Demonstrated leadership in previous roles through team mentorship. Excellent cultural fit based on communication style. Minor gap in cloud infrastructure experience but strong fundamentals. Overall assessment: HIGHLY RECOMMENDED for senior engineering role."
}
```

### Score Update Flow
1. n8n AI analyzes resume against job requirements
2. Generates numeric score (0-100) for `screening_score`
3. Generates detailed text analysis for `screening_summary`
4. Updates both fields in Supabase `candidates` table
5. Real-time subscription triggers
6. Dashboard updates instantly showing score AND detailed summary

---

## 4. Database Schema

### Jobs Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| title | TEXT | Job title |
| description | TEXT | Full description |
| requirements | TEXT | Scorecard/screening criteria |
| location | TEXT | Remote/On-site/Hybrid |
| department | TEXT | Team/Department |
| salary | TEXT | Salary range |
| status | TEXT | Active/Closed/Draft |
| created_at | TIMESTAMP | Auto-generated |

### Candidates Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| full_name | TEXT | Candidate name |
| email | TEXT | Contact email |
| linkedin | TEXT | LinkedIn URL |
| job_id | UUID (FK) | References jobs.id |
| resume_url | TEXT | Supabase Storage public URL |
| screening_score | INTEGER | 0-100 (null until n8n processes) |
| screening_summary | TEXT | Detailed AI analysis from n8n (null until processed) |
| created_at | TIMESTAMP | Auto-generated |

---

## 5. Real-time Subscriptions

### How It Works
```typescript
// src/lib/api.ts
const subscription = supabase
  .channel('candidates-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'candidates' }, 
    async (payload) => {
      // Refetch all candidates when ANY change occurs
      const candidates = await fetchCandidatesFromSupabase();
      callback(candidates);
    }
  )
  .subscribe();
```

### Events Monitored
- `INSERT` - New candidate applied
- `UPDATE` - n8n updated screening_score AND screening_summary
- `DELETE` - Candidate removed

### Frontend Updates
- `Index.tsx` - Dashboard stats update live
- `Jobs.tsx` - Applicant counts update live
- `Candidates.tsx` - Table updates with new scores and summaries
- `JobDetails.tsx` - Candidate lists refresh automatically

---

## 6. Security (RLS Policies)

### Jobs Table
- **SELECT**: Authenticated users can read all jobs
- **INSERT**: Authenticated users can create jobs
- **UPDATE**: Authenticated users can modify jobs
- **DELETE**: Authenticated users can delete jobs

### Candidates Table
- **SELECT**: Authenticated users can read all candidates
- **INSERT**: Authenticated users can create candidates
- **UPDATE**: Authenticated users can update candidates (for n8n)
- **DELETE**: Authenticated users can delete candidates

### Storage (Resumes Bucket)
- **SELECT**: Public access (for viewing resumes)
- **INSERT**: Authenticated users can upload
- **UPDATE**: Authenticated users can update
- **DELETE**: Authenticated users can delete

---

## 7. Key Files

- `src/lib/supabase.ts` - Supabase client and TypeScript types
- `src/lib/api.ts` - API functions for jobs, candidates, file upload, n8n webhooks
- `src/pages/Apply.tsx` - Public application form
- `src/pages/Candidates.tsx` - Candidate management with AI summaries
- `src/pages/Jobs.tsx` - Job management
- `src/pages/JobDetails.tsx` - Individual job view with applicants

---

## 8. Displaying AI Screening Summary

The Candidates page now displays the `screening_summary` in two places:

1. **Dark AI Analysis Card** - Shows the score badge and full summary text in the main candidate view
2. **Detailed Assessment Card** - A dedicated card with a document icon showing the full AI analysis

If `screening_summary` is null, it shows a fallback message indicating analysis is in progress or not available yet.

### Example Display

When viewing a candidate with both fields populated:
- Score Badge: "87% Match" (colored based on score)
- Summary Text: "Strong technical background with 6 years of React..."
- Timeline shows: "AI Analysis Complete - Score: 87% - Full assessment available"