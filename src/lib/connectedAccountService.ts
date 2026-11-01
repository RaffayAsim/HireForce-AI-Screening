import { saveEmailAccount, getEmailAccounts, setDefaultEmailAccount, EmailAccount } from './emailService';

export type UnifiedProvider = 'google' | 'microsoft' | 'hostinger' | 'zoho' | 'apple' | 'custom';

export interface ConnectedRecruiterAccount {
  id: string;
  user_id?: string;
  recruiter_name: string;
  email: string;
  provider: UnifiedProvider;
  connected_at: string;
  status: 'active' | 'disconnected';
  
  // Email Capability
  email_sync: {
    enabled: boolean;
    provider?: string;
    smtp_host: string;
    smtp_port: number;
    use_ssl: boolean;
    password?: string;
    last_synced?: string;
  };

  // Calendar Capability
  calendar_sync: {
    enabled: boolean;
    provider?: string;
    default_format: 'google_meet' | 'teams' | 'zoom' | 'phone';
    meeting_room_prefix?: string;
    calendar_name: string;
    live_ical_url?: string;
    last_synced?: string;
  };
}

export const getCurrentAuthUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vision_auth');
    if (!raw) return null;
    return JSON.parse(raw)?.id || null;
  } catch {
    return null;
  }
};

export const getConnectedAccountStorageKey = (userId?: string): string => {
  const uid = userId || getCurrentAuthUserId();
  if (uid) {
    return `hireforce_unified_account_${uid}`;
  }
  return 'hireforce_unauthenticated_account';
};

export const getVideoMeetingStorageKey = (userId?: string): string => {
  const uid = userId || getCurrentAuthUserId();
  if (uid) {
    return `hireforce_video_meeting_connected_${uid}`;
  }
  return 'hireforce_unauthenticated_meeting';
};

export const getConnectedAccount = (userId?: string): ConnectedRecruiterAccount | null => {
  if (typeof window === 'undefined') return null;
  try {
    const uid = userId || getCurrentAuthUserId();
    if (!uid) return null; // CRITICAL: NEVER return un-scoped accounts to unauthenticated callers

    // Verify user type
    let userType: string | undefined;
    try {
      const authRaw = localStorage.getItem('vision_auth');
      if (authRaw) {
        userType = JSON.parse(authRaw)?.userType;
      }
    } catch {}

    const key = `hireforce_unified_account_${uid}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const acc = JSON.parse(raw);
    // Strict isolation: if user is trial and account belongs to demo email, purge it immediately
    if (userType === 'trial' && acc?.email?.toLowerCase().includes('angellagarland')) {
      localStorage.removeItem(key);
      localStorage.removeItem(`hireforce_video_meeting_connected_${uid}`);
      return null;
    }

    if (acc?.user_id && acc.user_id !== uid) {
      return null;
    }
    return acc;
  } catch {
    return null;
  }
};

export const isEmailConnected = (userId?: string): boolean => {
  const acc = getConnectedAccount(userId);
  return Boolean(acc && acc.status === 'active' && (acc.email_sync?.enabled || acc.provider === 'google' || acc.provider === 'microsoft' || acc.email));
};

export const isCalendarConnected = (userId?: string): boolean => {
  const acc = getConnectedAccount(userId);
  return Boolean(acc && acc.status === 'active' && acc.calendar_sync?.enabled);
};

export const saveConnectedAccount = (account: ConnectedRecruiterAccount, userId?: string): void => {
  const effectiveUserId = userId || account.user_id || getCurrentAuthUserId() || undefined;
  if (!effectiveUserId) return;
  account.user_id = effectiveUserId;

  const key = `hireforce_unified_account_${effectiveUserId}`;
  localStorage.setItem(key, JSON.stringify(account));

  // Automatically register / update this account in the Email system so it can send immediately
  const providerMapping: Record<UnifiedProvider, EmailAccount['provider']> = {
    google: 'gmail',
    microsoft: 'outlook',
    hostinger: 'hostinger',
    zoho: 'zoho',
    apple: 'custom',
    custom: 'smtp',
  };

  if (account.email_sync?.enabled) {
    const emailAccounts = getEmailAccounts();
    const existing = emailAccounts.find(a => a.email.toLowerCase() === account.email.toLowerCase());

    if (existing) {
      setDefaultEmailAccount(existing.id);
    } else {
      saveEmailAccount({
        name: account.recruiter_name,
        email: account.email,
        provider: providerMapping[account.provider] || 'smtp',
        smtp_host: account.email_sync.smtp_host,
        smtp_port: account.email_sync.smtp_port,
        use_ssl: account.email_sync.use_ssl,
        app_password: account.email_sync.password,
        is_default: true,
      });
    }
  }

  window.dispatchEvent(new Event('unified_account_updated'));
};

export const disconnectEmailAccount = (userId?: string): void => {
  const effectiveUserId = userId || getCurrentAuthUserId() || undefined;
  if (!effectiveUserId) return;
  const current = getConnectedAccount(effectiveUserId);
  if (current) {
    current.email_sync.enabled = false;
    if (!current.calendar_sync?.enabled) {
      current.status = 'disconnected';
    }
    const key = `hireforce_unified_account_${effectiveUserId}`;
    localStorage.setItem(key, JSON.stringify(current));
    window.dispatchEvent(new Event('unified_account_updated'));
  }
};

export const disconnectCalendarAccount = (userId?: string): void => {
  const effectiveUserId = userId || getCurrentAuthUserId() || undefined;
  if (!effectiveUserId) return;
  const current = getConnectedAccount(effectiveUserId);
  if (current) {
    current.calendar_sync.enabled = false;
    if (!current.email_sync?.enabled) {
      current.status = 'disconnected';
    }
    const key = `hireforce_unified_account_${effectiveUserId}`;
    localStorage.setItem(key, JSON.stringify(current));
    window.dispatchEvent(new Event('unified_account_updated'));
  }
};

export const isVideoMeetingConnected = (userId?: string): boolean => {
  if (typeof window === 'undefined') return false;
  const effectiveUserId = userId || getCurrentAuthUserId() || undefined;
  if (!effectiveUserId) return false;

  const flag = localStorage.getItem(`hireforce_video_meeting_connected_${effectiveUserId}`);
  if (flag === 'false') return false;

  const acc = getConnectedAccount(effectiveUserId);
  if (!acc || acc.status === 'disconnected') return false;
  if ((acc.calendar_sync as any)?.video_enabled === false) return false;
  return Boolean(acc.calendar_sync?.enabled);
};

export const disconnectVideoMeetingAccount = (userId?: string): void => {
  const effectiveUserId = userId || getCurrentAuthUserId() || undefined;
  if (!effectiveUserId) return;
  localStorage.setItem(`hireforce_video_meeting_connected_${effectiveUserId}`, 'false');
  const current = getConnectedAccount(effectiveUserId);
  if (current) {
    if (current.calendar_sync) {
      (current.calendar_sync as any).video_enabled = false;
    }
    const key = `hireforce_unified_account_${effectiveUserId}`;
    localStorage.setItem(key, JSON.stringify(current));
  }
  window.dispatchEvent(new Event('unified_account_updated'));
};

export const connectVideoMeetingAccount = (format: 'teams' | 'google_meet' | 'zoom' = 'google_meet', userId?: string): void => {
  const effectiveUserId = userId || getCurrentAuthUserId() || undefined;
  if (!effectiveUserId) return;
  localStorage.setItem(`hireforce_video_meeting_connected_${effectiveUserId}`, 'true');
  const current = getConnectedAccount(effectiveUserId);
  if (current && current.calendar_sync) {
    (current.calendar_sync as any).video_enabled = true;
    current.calendar_sync.default_format = format as any;
    const key = `hireforce_unified_account_${effectiveUserId}`;
    localStorage.setItem(key, JSON.stringify(current));
  }
  window.dispatchEvent(new Event('unified_account_updated'));
};

export const disconnectAccount = (userId?: string): void => {
  const effectiveUserId = userId || getCurrentAuthUserId() || undefined;
  if (effectiveUserId) {
    localStorage.removeItem(`hireforce_video_meeting_connected_${effectiveUserId}`);
    localStorage.removeItem(`hireforce_unified_account_${effectiveUserId}`);
  }
  localStorage.removeItem('hireforce_unified_account');
  localStorage.removeItem('hireforce_video_meeting_connected');
  window.dispatchEvent(new Event('unified_account_updated'));
};
