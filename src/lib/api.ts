import { triggerAutomation } from './automationService';
import { supabase, isSupabaseConfigured } from './supabase';
import { getAuthHeaders, apiFetch } from './authHeader';
import { 
  getLocalJobs, 
  getLocalCandidates, 
  saveLocalJob, 
  updateLocalJob, 
  saveLocalCandidate, 
  updateLocalCandidateStatus,
  updateLocalCandidate,
  LocalJob,
  LocalCandidate
} from './localDatabase';

// Tenant configuration
let tenantConfig: {
  n8nWebhookUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
} | null = null;

// Master API config as fallback
const MASTER_CONFIG = {
  n8nWebhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://raffayasim.app.n8n.cloud/webhook/resume-screening',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

export const setTenantConfig = (config: typeof tenantConfig) => {
  tenantConfig = config;
};

export const resolveEffectiveUserId = (userId?: string): string | undefined => {
  if (userId) return userId;
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('vision_auth');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed?.id || undefined;
  } catch {
    return undefined;
  }
};

// ==========================================
// JOB API FUNCTIONS (Local Backup + Supabase)
// ==========================================

export const createJobInSupabase = async (data: any, userId?: string) => {
  const effectiveUserId = resolveEffectiveUserId(userId);
  const jobId = data.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

  // Strict column whitelist matching Supabase schema (screening_questions does not exist in jobs table)
  const jobData = {
    id: jobId,
    title: data.title,
    description: data.description || '',
    requirements: data.requirements || '',
    location: data.location || 'Remote',
    department: data.department || 'General',
    salary: data.salary || '',
    status: 'Active',
    user_id: effectiveUserId,
  };

  try {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(effectiveUserId),
      },
      body: JSON.stringify(jobData),
    });

    if (res.ok) {
      const json = await res.json();
      const inserted = json.job || jobData;
      if (typeof window !== 'undefined' && effectiveUserId) {
        try {
          const raw = localStorage.getItem(`vision_jobs_${effectiveUserId}`);
          const existing = raw ? JSON.parse(raw) : [];
          const updated = [inserted, ...existing.filter((j: any) => j.id !== inserted.id)];
          localStorage.setItem(`vision_jobs_${effectiveUserId}`, JSON.stringify(updated));
        } catch {}
      }
      window.dispatchEvent(new Event('jobs_updated'));
      return inserted;
    } else {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create job');
    }
  } catch (err: any) {
    console.error('Job create error:', err);
    throw err;
  }
};

export const fetchJobById = async (jobId: string) => {
  // Check local cache first for instant form loading
  const localJobs = getLocalJobs();
  const cached = localJobs.find(j => j.id === jobId);
  if (cached) return cached;

  // Fetch from /api/jobs (public view for applicants)
  try {
    const res = await fetch(`/api/jobs?id=${jobId}&public=true`);
    if (res.ok) {
      const data = await res.json();
      const job = data.job || (Array.isArray(data.jobs) ? data.jobs.find((j: any) => j.id === jobId) : null);
      if (job) {
        saveLocalJob(job);
        return job;
      }
    }
  } catch (err) {
    console.warn('Error fetching job from /api/jobs:', err);
  }

  return null;
};

export const subscribeToJobs = (callback: (jobs: any[]) => void, userId?: string) => {
  const effectiveUserId = resolveEffectiveUserId(userId);

  // Clean legacy shared storage keys that caused cross-tenant bleed and 6/6 flicker
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('hireforce_local_jobs');
      localStorage.removeItem('vision_jobs');
    } catch {}
  }

  // Immediately render user-scoped cached jobs if available (never load un-scoped 6 default jobs)
  try {
    if (typeof window !== 'undefined' && effectiveUserId && effectiveUserId !== 'admin-001') {
      const cachedRaw = localStorage.getItem(`vision_jobs_${effectiveUserId}`);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (Array.isArray(cached) && cached.length > 0) {
          callback(cached);
        }
      }
    }
  } catch {}

  if (isSupabaseConfigured) {
    const fetchRemoteJobs = async () => {
      try {
        const res = await fetch('/api/jobs', {
          headers: {
            ...getAuthHeaders(effectiveUserId),
          },
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.jobs || json;
          if (Array.isArray(data)) {
            // Authoritative server list replaces cache (fixes job list flicker and deleted jobs resurrecting)
            if (typeof window !== 'undefined' && effectiveUserId) {
              try {
                localStorage.setItem(`vision_jobs_${effectiveUserId}`, JSON.stringify(data));
              } catch {}
            }
            callback(data);
            return;
          }
        }
      } catch (err) {
        console.warn('fetchRemoteJobs error:', err);
      }
    };

    fetchRemoteJobs();

    // Polling fallback to guarantee instant detection of newly published jobs
    const pollInterval = setInterval(() => {
      fetchRemoteJobs();
    }, 3000);

    // Listen for real-time changes from Supabase
    const channelName = `realtime_jobs_${effectiveUserId || 'all'}_${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchRemoteJobs();
      })
      .subscribe();

    const handleCustomUpdate = () => fetchRemoteJobs();
    window.addEventListener('jobs_updated', handleCustomUpdate);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('jobs_updated', handleCustomUpdate);
      try { subscription.unsubscribe(); } catch {}
    };
  }

  // Offline fallback
  const emitLocal = () => {
    let local = getLocalJobs();
    if (effectiveUserId && effectiveUserId !== 'admin-001') {
      local = local.filter(j => j.user_id === effectiveUserId);
    }
    callback(local);
  };
  emitLocal();
  window.addEventListener('local_db_updated', emitLocal);
  return () => window.removeEventListener('local_db_updated', emitLocal);
};

// ==========================================
// CANDIDATE API FUNCTIONS (Supabase Direct)
// ==========================================

export const subscribeToCandidates = (callback: (candidates: any[]) => void, userId?: string) => {
  const effectiveUserId = resolveEffectiveUserId(userId);

  if (!effectiveUserId) {
    // Strict isolation: unauthenticated callers never receive candidate records
    callback([]);
    return () => {};
  }

  // Instant render from user-scoped cache
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`vision_candidates_${effectiveUserId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          callback(parsed);
        }
      }
    } catch {}
  }

  if (isSupabaseConfigured) {
    const fetchRemoteCandidates = async () => {
      try {
        const res = await apiFetch('/api/candidates');
        if (res.ok) {
          const json = await res.json();
          const data = json.candidates;
          if (Array.isArray(data)) {
            // Update user-scoped cache (never merge foreign candidates)
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(`vision_candidates_${effectiveUserId}`, JSON.stringify(data));
              } catch {}
            }

            callback(data);
            return;
          }
        }
      } catch (err) {
        console.warn('fetchRemoteCandidates error:', err);
      }
    };

    fetchRemoteCandidates();

    // Fast poll (3s) so background AI evaluations reflect live on the recruiter UI automatically
    const pollTimer = setInterval(fetchRemoteCandidates, 3000);

    // Listen for real-time candidate changes from Supabase
    const channelName = `realtime_candidates_${effectiveUserId}_${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
        fetchRemoteCandidates();
      })
      .subscribe();

    const handleCustomUpdate = () => fetchRemoteCandidates();
    window.addEventListener('candidates_updated', handleCustomUpdate);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('candidates_updated', handleCustomUpdate);
      try { subscription.unsubscribe(); } catch {}
    };
  }

  // Offline fallback
  const emitLocal = () => {
    let local = getLocalCandidates();
    if (effectiveUserId !== 'admin-001') {
      local = local.filter(c => c.user_id === effectiveUserId);
    }
    callback(local);
  };
  emitLocal();
  window.addEventListener('local_db_updated', emitLocal);
  return () => window.removeEventListener('local_db_updated', emitLocal);
};

const generateInitialScreeningSummary = (name: string, jobTitle: string, score: number) => {
  const role = jobTitle || 'Target Position';
  const candName = name || 'Candidate';
  const roleLower = role.toLowerCase();
  
  const isTech = roleLower.includes('ai') || roleLower.includes('software') || roleLower.includes('engineer') || roleLower.includes('developer') || roleLower.includes('intern') || roleLower.includes('data');
  const isOps = roleLower.includes('product') || roleLower.includes('operation') || roleLower.includes('manager') || roleLower.includes('head');

  const strengths = isTech ? [
    `Strong technical foundation and practical aptitude directly aligned with ${role} requirements.`,
    "Demonstrated competencies in system design, API integrations, and modern workflow tools.",
    "Clear problem-solving capability with rapid onboarding aptitude."
  ] : isOps ? [
    `Demonstrated organizational leadership and operational execution matching ${role}.`,
    "Proven track record in cross-functional coordination, process optimization, and delivery.",
    "Structured communication and stakeholder alignment skills."
  ] : [
    `Demonstrated domain proficiency and professional skills directly suited for ${role}.`,
    "Solid credentials with verifiable background matching key job specifications.",
    "High role readiness and team collaboration mindset."
  ];

  const topics = isTech ? [
    "Walk through an architecture, project, or workflow script you built from the ground up.",
    "How do you design for resilience and error handling when third-party services fail?",
    "Describe your approach to learning and adopting new technology stacks quickly."
  ] : isOps ? [
    "Describe how you manage competing project deadlines without sacrificing quality.",
    "Walk through an instance where you identified and resolved an operational bottleneck.",
    "How do you ensure clear communication across diverse stakeholders?"
  ] : [
    "Discuss your experience with key responsibilities required for this role.",
    "How do you prioritize deliverables when managing high-volume tasks?",
    "Describe an achievement that best illustrates your domain qualifications."
  ];

  const recommendation = score >= 88 ? "Advance to Interview" : "Schedule Technical Screen";

  return `Executive Summary:\n${candName} demonstrates strong qualifications and practical aptitude aligned with the ${role} position. Evaluated credentials indicate solid problem-solving fundamentals, dependable execution, and high role readiness.\n\nKey Strengths & Qualifications:\n${strengths.map(s => `• ${s}`).join('\n')}\n\nRecommended Interview Focus:\n${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nRecommendation: ${recommendation} (${score}% Match Score).`;
};

export const createCandidateApplication = async (data: any, userId?: string) => {
  let effectiveUserId = resolveEffectiveUserId(userId);
  if (!effectiveUserId && data.job_id) {
    const localJobs = getLocalJobs();
    const matchedJob = localJobs.find(j => j.id === data.job_id);
    if (matchedJob?.user_id) {
      effectiveUserId = matchedJob.user_id;
    }
  }

  const candidateId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
    ? crypto.randomUUID() 
    : `cand-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

  let resumeUrl = data.resume_file 
    ? URL.createObjectURL(data.resume_file)
    : '/sample-resume.pdf';

  // Try Supabase Storage upload with 3s timeout
  if (isSupabaseConfigured && data.resume_file) {
    try {
      const fileExt = data.resume_file.name.split('.').pop() || 'pdf';
      const fileName = `${data.name?.replace(/\s+/g, '_') || 'candidate'}-${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { data: publicUrlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        resumeUrl = publicUrlData.publicUrl;
      }

      uploadPromise = supabase.storage
        .from('resumes')
        .upload(filePath, data.resume_file)
        .catch(storageErr => console.warn('Storage upload fallback:', storageErr));
    } catch (storageErr) {
      console.warn('Storage upload setup fallback:', storageErr);
    }
  }

  // 1. Ensure storage upload completes (or timeout after 3.5s) before invoking server /api/apply
  if (uploadPromise) {
    try {
      await Promise.race([
        uploadPromise,
        new Promise(r => setTimeout(r, 3500))
      ]);
    } catch {}
  }

  // 2. Submit to server-side /api/apply (< 2s submit time)
  try {
    const applyPromise = fetch('/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: candidateId,
        job_id: data.job_id,
        job_title: data.jobTitle || data.job_title,
        company_name: data.company_name,
        recruiter_name: data.recruiter_name,
        name: data.name,
        email: data.email,
        phone: data.phone,
        linkedin: data.linkedin,
        resume_url: resumeUrl,
        resume_text: data.resume_text,
        user_id: effectiveUserId,
      }),
    });

    const applyRes = await applyPromise;
    if (applyRes && applyRes.ok) {
      const applyData = await applyRes.json();
      if (applyData.candidate?.user_id) {
        effectiveUserId = applyData.candidate.user_id;
      }
    }
  } catch (apiErr) {
    console.warn('Server application submission error:', apiErr);
  }

  const initialScore: number | null = null;
  const initialSummary = "AI screening evaluation in progress...";

  // Save to local database with derived effectiveUserId for instantaneous UI feedback
  const localCand = saveLocalCandidate({
    id: candidateId,
    full_name: data.name,
    email: data.email,
    phone: data.phone,
    linkedin: data.linkedin,
    job_id: data.job_id,
    resume_url: resumeUrl,
    status: 'new',
    user_id: effectiveUserId,
    screening_score: initialScore,
    screening_summary: initialSummary,
  });

  return localCand;
};

// ==========================================
// NATIVE AI SCREENING (REPLACES N8N)
// ==========================================
export const screenCandidateWithAI = async (params: {
  candidateId: string;
  jobId: string;
  jobTitle?: string;
  candidateName: string;
  candidateEmail?: string;
  resumeUrl?: string;
  resumeText?: string;
  userId?: string;
}) => {
  try {
    const res = await apiFetch('/api/screen-candidate', {
      method: 'POST',
      body: JSON.stringify({
        candidateId: params.candidateId,
        candidateName: params.candidateName,
        candidateEmail: params.candidateEmail,
        jobId: params.jobId,
        jobTitle: params.jobTitle || 'Role',
        resumeUrl: params.resumeUrl,
        resumeText: params.resumeText,
        userId: params.userId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.screening) {
        const sc = data.screening;
        updateLocalCandidate(params.candidateId, {
          screening_score: sc.score,
          screening_summary: sc.summary,
        });

        // Recruitment Automation: Top Tier AI Match Alert for Recruiter (85%+ score)
        if (sc.score >= 85) {
          try {
            triggerAutomation('top_tier_match_alert', {
              candidate_id: params.candidateId,
              candidate_name: params.candidateName,
              candidate_email: params.candidateEmail,
              job_title: params.jobTitle || 'Evaluated Role',
              screening_score: sc.score,
            });
          } catch (autoErr) {
            console.warn('Automation top_tier_match_alert error:', autoErr);
          }
        }

        // Sync to server database - preserve candidate stage
        apiFetch(`/api/candidates/${params.candidateId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            screening_score: sc.score,
            screening_summary: sc.summary,
          }),
        }).catch(() => {});

        return data;
      }
    }
  } catch (err) {
    console.warn('[Screening] Direct AI screening error:', err);
  }
  return null;
};

// Backward-compatible wrapper (routes to native AI screening)
export const sendToN8n = async (endpoint: string, data: any) => {
  if (endpoint === 'resume-screening' || endpoint.includes('screening')) {
    const res = await screenCandidateWithAI({
      candidateId: data.candidateId,
      jobId: data.jobId,
      jobTitle: data.jobTitle,
      candidateName: data.candidateName,
      candidateEmail: data.candidateEmail,
      resumeUrl: data.resumeUrl,
    });
    return { success: !!res };
  }
  return { success: true };
};

export type { Candidate, Job } from './supabase';

export const updateCandidateStatus = async (candidateId: string, status: any, score?: number, summary?: string) => {
  updateLocalCandidateStatus(candidateId, status, score, summary);
  try {
    apiFetch(`/api/candidates/${candidateId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(score !== undefined && { screening_score: score }),
        ...(summary !== undefined && { screening_summary: summary }),
      }),
    }).catch(() => {});
  } catch {}
};

export const updateCandidateJob = async (candidateId: string, jobId: string) => {
  updateLocalCandidate(candidateId, { job_id: jobId });
  try {
    apiFetch(`/api/candidates/${candidateId}`, {
      method: 'PATCH',
      body: JSON.stringify({ job_id: jobId }),
    }).catch(() => {});
  } catch {}
};

export const updateJobInSupabase = async (jobId: string, updates: any) => {
  updateLocalJob(jobId, updates);
  try {
    apiFetch('/api/jobs', {
      method: 'PATCH',
      body: JSON.stringify({ id: jobId, ...updates }),
    }).catch(() => {});
  } catch (err) {
    console.error('Error updating job via /api/jobs:', err);
  }
};

// ==========================================
// FULL PROFILE CLEAN RESET (FOR TESTING FRESH PROFILES)
// ==========================================
export const clearAllProfileData = async () => {
  if (typeof window !== 'undefined') {
    // 1. Wipe all local browser storage
    localStorage.setItem('hireforce_local_jobs', JSON.stringify([]));
    localStorage.setItem('hireforce_local_candidates', JSON.stringify([]));
    localStorage.setItem('hireforce_local_interviews', JSON.stringify([]));
    localStorage.setItem('hireforce_email_accounts', JSON.stringify([]));
    localStorage.setItem('hireforce_local_emails', JSON.stringify([]));
    localStorage.removeItem('hireforce_unified_account');

    // 2. Dispatch change notifications
    window.dispatchEvent(new Event('local_db_updated'));
    window.dispatchEvent(new Event('local_interviews_updated'));
    window.dispatchEvent(new Event('unified_account_updated'));
    window.dispatchEvent(new Event('local_email_accounts_updated'));
    window.dispatchEvent(new Event('local_emails_updated'));
  }

  // 3. Clear remote Supabase database rows if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('interviews').delete().neq('id', 'placeholder-id');
      await supabase.from('candidates').delete().neq('id', 'placeholder-id');
      await supabase.from('jobs').delete().neq('id', 'placeholder-id');
    } catch (err) {
      console.warn('Supabase remote clear error:', err);
    }
  }

  // 4. Clear server-side JSON and external connections
  try {
    await fetch('/api/clear-all-demo-data', { method: 'POST' });
  } catch {}
};
