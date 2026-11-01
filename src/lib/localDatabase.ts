
export const cleanText = (str: string): string => {
  if (!str) return '';
  try {
    return str
      .normalize('NFKD')
      .replace(/[\uD835][\uDC00-\uDFFF]/g, '') // remove surrogate math bold
      .replace(/[^\x00-\x7F]/g, (char) => {
        if (char === '’' || char === '‘') return "'";
        if (char === '“' || char === '”') return '"';
        if (char === '–' || char === '—') return '-';
        return char;
      })
      .trim();
  } catch {
    return str;
  }
};
import backupData from './backupData.json';
import { getAuthHeaders, apiFetch } from './authHeader';

const JOBS_STORAGE_KEY = 'hireforce_local_jobs';
const CANDIDATES_STORAGE_KEY = 'hireforce_local_candidates';

export interface LocalJob {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  department?: string;
  salary?: string;
  screening_questions?: string;
  status?: string;
  created_at: string;
  user_id?: string;
}

export interface LocalCandidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  job_id: string;
  resume_url?: string;
  screening_score: number | null;
  screening_summary?: string | null;
  screening_answers?: string[];
  status?: 'new' | 'good' | 'waiting' | 'rejected' | 'hired';
  created_at?: string;
  user_id?: string;
}

// Initialize empty local database if not present
export const initLocalDatabase = () => {
  if (typeof window === 'undefined') return;

  const existingJobs = localStorage.getItem(JOBS_STORAGE_KEY);
  if (existingJobs === null) {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify([]));
  }

  const existingCandidates = localStorage.getItem(CANDIDATES_STORAGE_KEY);
  if (existingCandidates === null) {
    localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify([]));
  }
};

export const clearAllLocalData = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('local_db_updated'));
};

// Force reset to original backup (optional demo restore)
export const resetToBackup = () => {
  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(backupData.jobs));
  localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(backupData.candidates));
  window.dispatchEvent(new Event('local_db_updated'));
};

export const getLocalJobs = (): LocalJob[] => {
  initLocalDatabase();
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    const jobs: LocalJob[] = raw ? JSON.parse(raw) : [];

    // Auto-migrate any mathematical unicode serif or corrupt titles
    let needsUpdate = false;
    const cleaned = jobs.map(j => {
      let title = j.title || '';
      if (j.id === '68119633-6ac1-42d5-9279-38322a6b9c47' && title !== 'AI Engineer') {
        title = 'AI Engineer';
        needsUpdate = true;
      } else if (title.includes('\uD835') || title.length !== cleanText(title).length) {
        title = cleanText(title) || title;
        needsUpdate = true;
      }
      return { ...j, title };
    });

    if (needsUpdate && typeof window !== 'undefined') {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
};

export const getLocalCandidates = (): LocalCandidate[] => {
  initLocalDatabase();
  try {
    const raw = localStorage.getItem(CANDIDATES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveLocalJob = (job: Partial<LocalJob>): LocalJob => {
  const jobs = getLocalJobs();
  const newJob: LocalJob = {
    id: job.id || `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    title: job.title || 'Untitled Role',
    description: job.description || '',
    requirements: job.requirements || '',
    location: job.location || 'Remote',
    department: job.department || 'General',
    salary: job.salary || '',
    screening_questions: job.screening_questions || '',
    status: job.status || 'Active',
    created_at: job.created_at || new Date().toISOString(),
    user_id: job.user_id,
  };

  const updated = [newJob, ...jobs];
  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('local_db_updated'));
  return newJob;
};

export const saveLocalCandidate = (candidate: Partial<LocalCandidate>): LocalCandidate => {
  const candidates = getLocalCandidates();
  const newCandidate: LocalCandidate = {
    id: candidate.id || `cand-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    full_name: candidate.full_name || 'Anonymous Applicant',
    email: candidate.email || '',
    phone: candidate.phone || '',
    linkedin: candidate.linkedin || '',
    job_id: candidate.job_id || '',
    resume_url: candidate.resume_url || '',
    screening_score: candidate.screening_score ?? null,
    screening_summary: candidate.screening_summary ?? null,
    screening_answers: candidate.screening_answers || [],
    status: candidate.status || 'new',
    created_at: candidate.created_at || new Date().toISOString(),
    user_id: candidate.user_id,
  };

  const updated = [newCandidate, ...candidates];
  localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('local_db_updated'));

  // Sync to persistent server file across tabs and sessions
  try {
    apiFetch('/api/candidates', {
      method: 'POST',
      body: JSON.stringify(newCandidate),
    }).catch(() => { });
  } catch { }

  return newCandidate;
};

export const updateLocalCandidateStatus = (candidateId: string, status: LocalCandidate['status'], score?: number, summary?: string) => {
  const candidates = getLocalCandidates();
  const updated = candidates.map(c => {
    if (c.id === candidateId) {
      return {
        ...c,
        ...(status && { status }),
        ...(score !== undefined && { screening_score: score }),
        ...(summary !== undefined && { screening_summary: summary }),
      };
    }
    return c;
  });

  localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('local_db_updated'));

  // Sync to persistent server file
  try {
    apiFetch(`/api/candidates/${candidateId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(score !== undefined && { screening_score: score }),
        ...(summary !== undefined && { screening_summary: summary }),
      }),
    }).catch(() => { });
  } catch { }
};

export const deleteLocalJob = (jobId: string) => {
  const jobs = getLocalJobs().filter(j => j.id !== jobId);
  const candidates = getLocalCandidates().filter(c => c.job_id !== jobId);
  localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(candidates));
  window.dispatchEvent(new Event('local_db_updated'));
};

export const updateLocalCandidate = (candidateId: string, updates: Partial<LocalCandidate>) => {
  const candidates = getLocalCandidates();
  const updated = candidates.map(c => {
    if (c.id === candidateId) {
      return { ...c, ...updates };
    }
    return c;
  });

  localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('local_db_updated'));

  // Sync to persistent server file
  try {
    apiFetch(`/api/candidates/${candidateId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }).catch(() => { });
  } catch { }
};

export const updateLocalJob = (jobId: string, updates: Partial<LocalJob>): LocalJob | null => {
  const jobs = getLocalJobs();
  let updatedJob: LocalJob | null = null;
  const updated = jobs.map(j => {
    if (j.id === jobId) {
      updatedJob = { ...j, ...updates };
      return updatedJob;
    }
    return j;
  });

  if (updatedJob) {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('local_db_updated'));
  }
  return updatedJob;
};
