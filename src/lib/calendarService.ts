import { getAuthHeaders } from './authHeader';
import { getCurrentAuthUserId } from './connectedAccountService';

export interface Interview {
  id: string;
  user_id?: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  job_id: string;
  job_title: string;
  round_type: 'Initial Screen' | 'Technical Round' | 'AI Assessment Review' | 'Hiring Manager' | 'Final Round';
  meeting_format: 'google_meet' | 'teams' | 'zoom' | 'phone' | 'in_person' | 'zoho_meeting';
  meeting_link?: string;
  phone_number?: string;
  location?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration_minutes: number;
  interviewer: string;
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

const STORAGE_KEY = 'hireforce_local_interviews';

const getInitialInterviews = (): Interview[] => {
  return [];
};

export const getInterviews = (userId?: string): Interview[] => {
  if (typeof window === 'undefined' || !userId) {
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem(STORAGE_KEY); } catch { }
    }
    return [];
  }
  try {
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
    const raw = localStorage.getItem(`hireforce_local_interviews_${userId}`);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i: any) => !i.user_id || i.user_id === userId)
      .map((i: any) => ({
        ...i,
        user_id: i.user_id || userId,
        duration_minutes: i.duration_minutes || i.duration || 45,
        round_type: i.round_type || 'Technical Round',
        status: i.status === 'scheduled' ? 'Scheduled' : (i.status || 'Scheduled'),
        interviewer: i.interviewer || i.host_recruiter || 'Talent Acquisition Team',
        meeting_format: i.meeting_format || i.format || (i.phone_number ? 'phone' : i.meeting_link?.includes('teams') ? 'teams' : 'google_meet'),
      }));
  } catch {
    return [];
  }
};

export const clearAllInterviews = (userId?: string) => {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { }
  if (userId) {
    try { localStorage.removeItem(`hireforce_local_interviews_${userId}`); } catch { }
  }
  window.dispatchEvent(new Event('local_interviews_updated'));
  try {
    fetch('/api/calendar/clear', { method: 'POST' }).catch(() => { });
  } catch { }
};

export const saveInterview = (interview: Omit<Interview, 'id'>, userId?: string): Interview => {
  const targetUserId = userId || (interview as any).user_id;
  const interviews = targetUserId ? getInterviews(targetUserId) : [];
  const newInterview: Interview = {
    ...interview,
    user_id: targetUserId,
    id: (interview as any).id || `int-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  };

  const updated = [newInterview, ...interviews.filter(i => i.id !== newInterview.id)];
  if (typeof window !== 'undefined' && targetUserId) {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(`hireforce_local_interviews_${targetUserId}`, JSON.stringify(updated));
    } catch { }
  }
  window.dispatchEvent(new Event('local_interviews_updated'));

  // Also sync to server endpoint
  try {
    fetch('/api/calendar/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(targetUserId)
      },
      body: JSON.stringify({ ...newInterview, userId: targetUserId }),
    }).then(async (res) => {
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.event?.meeting_link && json.event.meeting_link !== newInterview.meeting_link && targetUserId) {
          const fresh = getInterviews(targetUserId);
          const refreshed = fresh.map(i => i.id === newInterview.id ? { ...i, meeting_link: json.event.meeting_link } : i);
          localStorage.setItem(`hireforce_local_interviews_${targetUserId}`, JSON.stringify(refreshed));
          window.dispatchEvent(new Event('local_interviews_updated'));
        }
      }
    }).catch(() => { });
  } catch { }

  return newInterview;
};

export const saveInterviewAsync = async (interview: Omit<Interview, 'id'>, userId?: string): Promise<Interview> => {
  const targetUserId = userId || (interview as any).user_id;
  const interviews = targetUserId ? getInterviews(targetUserId) : [];
  let finalInterview: Interview = {
    ...interview,
    user_id: targetUserId,
    id: (interview as any).id || `int-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  };

  const res = await fetch('/api/calendar/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(targetUserId)
    },
    body: JSON.stringify({ ...finalInterview, user_id: targetUserId }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to create calendar event (${res.status})`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to create calendar event');
  }

  if (json.event?.meeting_link) {
    finalInterview.meeting_link = json.event.meeting_link;
  }
  if (json.event?.id) {
    finalInterview.id = json.event.id;
  }

  if (interview.meeting_format === 'google_meet' && (!finalInterview.meeting_link || !finalInterview.meeting_link.includes('meet.google.com/'))) {
    throw new Error('Google Calendar did not return a valid Google Meet link.');
  }

  // Deduplicate against existing interviews by ID or (candidate_id, date, time)
  const isDuplicate = (i: Interview) =>
    i.id === finalInterview.id ||
    (finalInterview.candidate_id && i.candidate_id === finalInterview.candidate_id && i.date === finalInterview.date && i.time === finalInterview.time) ||
    (finalInterview.meeting_link && i.meeting_link === finalInterview.meeting_link);

  const updated = [finalInterview, ...interviews.filter(i => !isDuplicate(i))];
  if (typeof window !== 'undefined' && targetUserId) {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(`hireforce_local_interviews_${targetUserId}`, JSON.stringify(updated));
    } catch { }
  }
  window.dispatchEvent(new Event('local_interviews_updated'));

  return finalInterview;
};

export const updateInterviewStatus = (id: string, status: Interview['status'], userId?: string) => {
  const targetUserId = userId || getCurrentAuthUserId() || undefined;
  if (!targetUserId) return;
  const interviews = getInterviews(targetUserId);
  const target = interviews.find(i => i.id === id);
  const updated = interviews.map(i => {
    if (i.id === id) return { ...i, status };
    if (target && target.candidate_id && i.candidate_id === target.candidate_id && i.date === target.date && i.time === target.time) {
      return { ...i, status };
    }
    return i;
  });
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(`hireforce_local_interviews_${targetUserId}`, JSON.stringify(updated));
    } catch { }
  }
  window.dispatchEvent(new Event('local_interviews_updated'));
};

export const deleteInterview = (id: string, userId?: string, candidateId?: string, date?: string, time?: string) => {
  const targetUserId = userId || getCurrentAuthUserId() || undefined;
  if (!targetUserId) return;
  const interviews = getInterviews(targetUserId);
  const target = interviews.find(i => i.id === id);
  const cId = candidateId || target?.candidate_id;
  const dStr = date || target?.date;
  const tStr = time || target?.time;

  const updated = interviews.filter(i => {
    if (i.id === id) return false;
    if (cId && dStr && tStr && i.candidate_id === cId && i.date === dStr && i.time === tStr) return false;
    return true;
  });
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(`hireforce_local_interviews_${targetUserId}`, JSON.stringify(updated));
    } catch { }
  }
  window.dispatchEvent(new Event('local_interviews_updated'));
};
