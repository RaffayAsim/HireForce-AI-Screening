import { getConnectedAccount } from './connectedAccountService';
import { sendEmail } from './emailService';
import { getAuthHeaders } from './authHeader';

export type AutomationTrigger =
  | 'application_received'
  | 'interview_scheduled'
  | 'candidate_rejected'
  | 'interview_reminder_24h'
  | 'interview_reminder_1h'
  | 'top_tier_match_alert';

export interface AutomationWorkflow {
  id: string;
  trigger: AutomationTrigger;
  title: string;
  category: 'candidate_outreach' | 'interview_coordination' | 'internal_alerts';
  badgeLabel: string;
  badgeColor: string;
  description: string;
  enabled: boolean;
  subjectTemplate: string;
  bodyTemplate: string;
  delayMinutes?: number;
  updated_at?: string;
}

export interface AutomationLog {
  id: string;
  workflow_id: string;
  workflow_title: string;
  trigger: AutomationTrigger;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  body: string;
  delivery_method: string;
  status: 'delivered' | 'sent' | 'skipped' | 'failed';
  timestamp: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

const WORKFLOWS_STORAGE_KEY = 'hireforce_automation_workflows';
const LOGS_STORAGE_KEY = 'hireforce_automation_logs';

// Delete legacy un-scoped storage keys that caused cross-tenant email leak (FIX 4)
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('hireforce_automation_logs');
    localStorage.removeItem('hireforce_email_threads');
  } catch { }
}

const getLogsStorageKey = (userId?: string) => {
  return (userId && userId !== 'admin-001') ? `${LOGS_STORAGE_KEY}_${userId}` : LOGS_STORAGE_KEY;
};

export const DEFAULT_WORKFLOWS: AutomationWorkflow[] = [
  {
    id: 'wf_app_received',
    trigger: 'application_received',
    title: 'Application Received Confirmation',
    category: 'candidate_outreach',
    badgeLabel: 'Candidate Outreach',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Instantly dispatches a professional confirmation email from HR when an applicant submits their resume.',
    enabled: true,
    subjectTemplate: 'Application Received: {{job_title}} at {{company_name}}',
    bodyTemplate: `Hi {{candidate_name}},

Thank you for your interest in the {{job_title}} position at {{company_name}}. We have successfully received your application and resume.

Our hiring team is currently evaluating your background, skills, and qualifications against the role requirements. If your profile aligns with our criteria, we will reach out to schedule next steps.

Best regards,
{{recruiter_name}}
{{company_name}} Recruiting Team`
  },
  {
    id: 'wf_interview_scheduled',
    trigger: 'interview_scheduled',
    title: 'Interview Invitation & Meeting Room Details',
    category: 'interview_coordination',
    badgeLabel: 'Interview Coordination',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'Sends calendar invites with live Google Meet, Microsoft Teams links, or on-site physical office directions.',
    enabled: true,
    subjectTemplate: 'Interview Invitation: {{job_title}} ({{round_type}})',
    bodyTemplate: `Hi {{candidate_name}},

We are pleased to invite you for your {{round_type}} for the {{job_title}} position at {{company_name}}.

📅 Scheduled Date & Time: {{interview_date_time}}
🎥 Meeting Format: {{meeting_format}}
📍 Join Link / Location: {{meeting_link_or_address}}

Please ensure you are in a quiet environment a few minutes prior to the scheduled time. If you have any questions or need to reschedule, simply reply to this email.

Looking forward to speaking with you!

Warm regards,
{{recruiter_name}}
{{company_name}}`
  },
  {
    id: 'wf_candidate_rejected',
    trigger: 'candidate_rejected',
    title: 'Candidate Rejection Notice',
    category: 'candidate_outreach',
    badgeLabel: 'Candidate Outreach',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Dispatches a polite, respectful rejection email from HR whenever a candidate is moved to the Rejected stage.',
    enabled: true,
    subjectTemplate: 'Update regarding your application for {{job_title}} at {{company_name}}',
    bodyTemplate: `Hi {{candidate_name}},

Thank you for taking the time to apply for the {{job_title}} role at {{company_name}} and for your interest in joining our team.

After careful evaluation of all submissions, we have decided to move forward with other candidates whose current skill set and experience more closely match our specific requirements for this opening.

We sincerely appreciate your time and effort throughout the application process, and we wish you the very best in your career pursuits.

Best regards,
{{company_name}} Talent Acquisition Team`
  },
  {
    id: 'wf_reminder_24h',
    trigger: 'interview_reminder_24h',
    title: '24-Hour Interview Reminder',
    category: 'interview_coordination',
    badgeLabel: 'No-Show Prevention',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Automated reminder dispatched 24 hours prior to the scheduled interview to drastically cut candidate no-shows.',
    enabled: true,
    subjectTemplate: 'Reminder: Interview tomorrow for {{job_title}}',
    bodyTemplate: `Hi {{candidate_name}},

This is a friendly reminder that your {{round_type}} for {{job_title}} is scheduled for tomorrow.

📅 Date & Time: {{interview_date_time}}
🔗 Join Link / Location: {{meeting_link_or_address}}

Please let us know if anything unexpected arises. We look forward to our discussion!

Best regards,
{{recruiter_name}}`
  },
  {
    id: 'wf_reminder_1h',
    trigger: 'interview_reminder_1h',
    title: '1-Hour Final Interview Reminder',
    category: 'interview_coordination',
    badgeLabel: 'Final Countdown',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Sends a final alert 1 hour before interview time with direct 1-click meeting join link.',
    enabled: true,
    subjectTemplate: 'Starting in 1 Hour: Interview for {{job_title}}',
    bodyTemplate: `Hi {{candidate_name}},

Your interview for {{job_title}} begins in 1 hour!

🔗 Click here to join: {{meeting_link_or_address}}

See you soon,
{{recruiter_name}}`
  },
  {
    id: 'wf_top_tier_alert',
    trigger: 'top_tier_match_alert',
    title: 'Top Tier AI Match Alert (Internal HR)',
    category: 'internal_alerts',
    badgeLabel: 'Internal Notification',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Notifies the recruiter immediately when an applicant achieves an 85%+ AI screening match score.',
    enabled: true,
    subjectTemplate: '🌟 Top Match Applicant: {{candidate_name}} ({{screening_score}}%) for {{job_title}}',
    bodyTemplate: `Hello {{recruiter_name}},

A high-performing candidate just completed AI screening for {{job_title}} with an exceptional score:

• Candidate Name: {{candidate_name}}
• Contact Email: {{candidate_email}}
• AI Match Score: {{screening_score}}%
• Target Role: {{job_title}}

Open HireForce candidate pipeline to review their evaluation dossier and schedule an initial screen.`
  }
];

export const getAutomationWorkflows = (): AutomationWorkflow[] => {
  if (typeof window === 'undefined') return DEFAULT_WORKFLOWS;
  try {
    const raw = localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(DEFAULT_WORKFLOWS));
      return DEFAULT_WORKFLOWS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Merge with default in case new workflows were added
      return DEFAULT_WORKFLOWS.map(def => {
        const found = parsed.find(p => p.id === def.id || p.trigger === def.trigger);
        return found ? { ...def, ...found } : def;
      });
    }
    return DEFAULT_WORKFLOWS;
  } catch {
    return DEFAULT_WORKFLOWS;
  }
};

export const updateAutomationWorkflow = (id: string, updates: Partial<AutomationWorkflow>): void => {
  const current = getAutomationWorkflows();
  const updated = current.map(w => w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w);
  localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('automations_updated'));
};

export const resetAutomationWorkflowsToDefault = (): void => {
  localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(DEFAULT_WORKFLOWS));
  window.dispatchEvent(new Event('automations_updated'));
};

export const getAutomationLogs = (userId?: string): AutomationLog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const key = getLogsStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (userId && userId !== 'admin-001') {
      return parsed.filter(l => (l.user_id === userId || l.metadata?.user_id === userId));
    }
    return parsed;
  } catch {
    return [];
  }
};

export const clearAutomationLogs = (userId?: string): void => {
  const key = getLogsStorageKey(userId);
  localStorage.setItem(key, JSON.stringify([]));
  window.dispatchEvent(new Event('automation_logs_updated'));
};

export const saveAutomationLog = (log: AutomationLog): void => {
  const effectiveUserId = log.user_id || log.metadata?.user_id;
  const key = getLogsStorageKey(effectiveUserId);
  let existing: AutomationLog[] = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) existing = JSON.parse(raw);
  } catch { }
  const updated = [log, ...existing].slice(0, 100);
  localStorage.setItem(key, JSON.stringify(updated));
  window.dispatchEvent(new Event('automation_logs_updated'));
};

// Variable interpolation helper
export const interpolateTemplate = (template: string, vars: Record<string, any>): string => {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : match;
  });
};

// Execute an automated workflow by trigger
export const triggerAutomation = async (
  trigger: AutomationTrigger,
  context: {
    candidate_id?: string;
    candidate_name?: string;
    candidate_email?: string;
    job_title?: string;
    company_name?: string;
    round_type?: string;
    meeting_format?: string;
    meeting_link_or_address?: string;
    interview_date_time?: string;
    screening_score?: number;
    recruiter_name?: string;
    recruiter_email?: string;
    user_id?: string;
    recruiter_id?: string;
  }
): Promise<AutomationLog | null> => {
  const workflows = getAutomationWorkflows();
  const workflow = workflows.find(w => w.trigger === trigger);

  if (!workflow || !workflow.enabled) {
    return null; // Workflow is disabled by HR
  }

  const effectiveUserId = context.user_id || context.recruiter_id;
  const account = getConnectedAccount(effectiveUserId);

  let sessionUser: any = null;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('vision_auth') : null;
    if (raw) sessionUser = JSON.parse(raw);
  } catch { }

  const rawCompany = context.company_name;
  const isInvalidCompany = !rawCompany ||
    rawCompany.toLowerCase() === 'engineering' ||
    rawCompany.toLowerCase() === 'general' ||
    rawCompany.includes('@');

  const companyName = !isInvalidCompany
    ? rawCompany
    : (sessionUser?.companyName || 'HireForce');

  const rawRecruiterName = context.recruiter_name || account?.recruiter_name || sessionUser?.fullName || '';
  const recruiterName = (rawRecruiterName && !rawRecruiterName.includes('@'))
    ? rawRecruiterName
    : 'Hiring Team';
  const recruiterEmail = context.recruiter_email || account?.email || 'recruiting@hireforce.ai';

  let rawDateTime = context.interview_date_time || 'Scheduled Time';
  if (rawDateTime && !rawDateTime.includes('(') && typeof Intl !== 'undefined') {
    try {
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tzShort = new Date().toLocaleTimeString('en-us', { timeZoneName: 'short' }).split(' ')[2] || tzName;
      rawDateTime = `${rawDateTime} (${tzShort})`;
    } catch { }
  }

  const templateVars = {
    candidate_name: context.candidate_name || 'Candidate',
    candidate_email: context.candidate_email || '',
    job_title: context.job_title || 'Position',
    company_name: companyName,
    round_type: context.round_type || 'Interview',
    meeting_format: context.meeting_format || 'Google Meet',
    meeting_link_or_address: context.meeting_link_or_address || '',
    interview_date_time: rawDateTime,
    screening_score: context.screening_score || 'N/A',
    recruiter_name: recruiterName,
    recruiter_email: recruiterEmail,
  };

  const subject = interpolateTemplate(workflow.subjectTemplate, templateVars);
  const body = interpolateTemplate(workflow.bodyTemplate, templateVars);

  const recipientEmail = trigger === 'top_tier_match_alert'
    ? recruiterEmail
    : (context.candidate_email || 'candidate@example.com');
  const recipientName = trigger === 'top_tier_match_alert'
    ? recruiterName
    : (context.candidate_name || 'Candidate');

  let deliveryMethod = 'HR Connected Mailbox';
  if (trigger === 'interview_scheduled' || trigger === 'interview_reminder_24h' || trigger === 'interview_reminder_1h') {
    deliveryMethod = context.meeting_format || 'Video Meeting';
  }

  // 1. Sync directly into Email Conversation Thread so recruiter can review in /emails
  if (context.candidate_id && trigger !== 'top_tier_match_alert') {
    try {
      sendEmail({
        candidate_id: context.candidate_id,
        candidate_name: recipientName,
        candidate_email: recipientEmail,
        job_title: context.job_title || 'Position',
        subject,
        content: body,
      });
    } catch (e) {
      console.warn('Failed to record in local email thread:', e);
    }
  }

  // 2. Dispatch real email via connected Gmail / Outlook API
  let deliveryStatus: 'delivered' | 'sent' | 'skipped' | 'failed' = 'delivered';
  let deliveryError: string | undefined = undefined;

  try {
    const targetUid = effectiveUserId || account?.user_id;
    const res = await fetch('/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(targetUid)
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject,
        content: body,
        userId: targetUid,
        fromName: `${companyName} Recruiting Team`,
      }),
    });
    const resData = await res.json().catch(() => ({}));
    if (resData.success && resData.delivered && (resData.id || resData.messageId)) {
      deliveryStatus = 'delivered';
    } else {
      console.warn('Real email dispatch error:', resData.error || resData.note);
      deliveryStatus = 'failed';
      deliveryError = resData.error || resData.note || 'No mailbox connected for this recruiter';
    }
  } catch (err: any) {
    console.warn('Real email dispatch network error:', err);
    deliveryStatus = 'failed';
    deliveryError = err?.message;
  }

  // 3. Create execution audit log
  const log: AutomationLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    workflow_id: workflow.id,
    workflow_title: workflow.title,
    trigger,
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    subject,
    body,
    delivery_method: deliveryMethod,
    status: deliveryStatus,
    timestamp: new Date().toISOString(),
    user_id: effectiveUserId,
    metadata: {
      candidate_id: context.candidate_id,
      user_id: effectiveUserId,
      job_title: context.job_title,
      meeting_format: context.meeting_format,
      score: context.screening_score,
      delivered: deliveryStatus === 'delivered',
      error: deliveryError,
      message_id: resData?.messageId || resData?.id || null,
    }
  };

  saveAutomationLog(log);
  return log;
};

// Track sent reminders to prevent duplicate dispatches
const SENT_REMINDERS_KEY = 'hireforce_sent_reminders';

export const getSentReminderKeys = (): Record<string, boolean> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SENT_REMINDERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const markReminderSent = (key: string): void => {
  const current = getSentReminderKeys();
  current[key] = true;
  localStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(current));
};

export const checkAndDispatchInterviewReminders = async (userId?: string): Promise<{ dispatched24h: number; dispatched1h: number }> => {
  if (typeof window === 'undefined') return { dispatched24h: 0, dispatched1h: 0 };
  let dispatched24h = 0;
  let dispatched1h = 0;

  try {
    const key = userId ? `hireforce_local_interviews_${userId}` : null;
    const raw = key ? localStorage.getItem(key) : null;
    if (!raw) return { dispatched24h, dispatched1h };
    const interviews = JSON.parse(raw);
    if (!Array.isArray(interviews)) return { dispatched24h, dispatched1h };

    const sentMap = getSentReminderKeys();
    const now = new Date().getTime();

    for (const int of interviews) {
      if (int.status === 'Cancelled' || int.status === 'Completed') continue;
      if (!int.date || !int.candidate_email) continue;

      const datePart = int.date.split('T')[0];
      const timePart = int.time || '12:00';
      const scheduledDateTime = new Date(`${datePart}T${timePart}:00`).getTime();
      if (isNaN(scheduledDateTime)) continue;

      const diffMs = scheduledDateTime - now;
      const diffHours = diffMs / (1000 * 60 * 60);

      const key24h = `${int.id}_24h`;
      const key1h = `${int.id}_1h`;

      // 24-Hour Reminder: Between 1 hour and 25 hours away
      if (diffHours <= 25 && diffHours > 1 && !sentMap[key24h]) {
        markReminderSent(key24h);
        await triggerAutomation('interview_reminder_24h', {
          candidate_id: int.candidate_id,
          candidate_name: int.candidate_name,
          candidate_email: int.candidate_email,
          job_title: int.job_title || 'Position',
          round_type: int.round_type || 'Interview',
          meeting_format: int.meeting_format === 'teams' ? 'Microsoft Teams' : (int.meeting_format === 'phone' ? 'Phone' : 'Google Meet'),
          meeting_link_or_address: int.meeting_link || int.phone_number || int.location || 'Online',
          interview_date_time: `${datePart} at ${timePart}`,
        });
        dispatched24h++;
      }

      // 1-Hour Reminder: Between 0 and 1.5 hours away
      if (diffHours <= 1.5 && diffHours >= -0.25 && !sentMap[key1h]) {
        markReminderSent(key1h);
        await triggerAutomation('interview_reminder_1h', {
          candidate_id: int.candidate_id,
          candidate_name: int.candidate_name,
          candidate_email: int.candidate_email,
          job_title: int.job_title || 'Position',
          round_type: int.round_type || 'Interview',
          meeting_format: int.meeting_format === 'teams' ? 'Microsoft Teams' : (int.meeting_format === 'phone' ? 'Phone' : 'Google Meet'),
          meeting_link_or_address: int.meeting_link || int.phone_number || int.location || 'Online',
          interview_date_time: `${datePart} at ${timePart}`,
        });
        dispatched1h++;
      }
    }
  } catch (e) {
    console.warn('checkAndDispatchInterviewReminders error:', e);
  }

  return { dispatched24h, dispatched1h };
};
