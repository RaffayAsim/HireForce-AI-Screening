"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getAuthHeaders, apiFetch } from '@/lib/authHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Mail,
  Calendar as CalendarIcon,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Building2
} from 'lucide-react';
import {
  ConnectedRecruiterAccount,
  saveConnectedAccount,
  getConnectedAccount,
  UnifiedProvider,
  connectVideoMeetingAccount
} from '@/lib/connectedAccountService';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

export type ConnectCategory = 'email' | 'calendar' | 'meeting' | 'all';

export interface IntegrationProvider {
  id: string;
  name: string;
  nangoConfigKey: string;
  category: 'email' | 'calendar';
  typeLabel: string;
  tagline: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconLetter: string;
  accentColor: string;
  unifiedProvider: UnifiedProvider;
  meetingFormat?: 'google_meet' | 'teams' | 'zoom';
  smtpHost?: string;
  smtpPort?: number;
  useSsl?: boolean;
}

export const ALL_INTEGRATIONS: IntegrationProvider[] = [
  // Email providers
  {
    id: 'outlook-email',
    name: 'Microsoft 365 / Outlook',
    nangoConfigKey: 'outlook',
    category: 'email',
    typeLabel: 'Email Sync',
    tagline: 'Connect Microsoft 365 or Outlook work email for candidate communications',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    iconLetter: 'O',
    accentColor: '#0078D4',
    unifiedProvider: 'microsoft',
    meetingFormat: 'teams',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    useSsl: false,
  },
  {
    id: 'google-mail',
    name: 'Gmail / Google Workspace',
    nangoConfigKey: 'google-mail',
    category: 'email',
    typeLabel: 'Email Sync',
    tagline: 'Connect Google Workspace or Gmail to send candidate invites & sync threads',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-200',
    iconLetter: 'M',
    accentColor: '#EA4335',
    unifiedProvider: 'google',
    meetingFormat: 'google_meet',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    useSsl: true,
  },
  {
    id: 'zoho-mail',
    name: 'Zoho Mail / Workplace',
    nangoConfigKey: 'zoho-mail',
    category: 'email',
    typeLabel: 'Email Sync',
    tagline: 'Connect your corporate Zoho Mail account to send candidate correspondence',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    iconLetter: 'Z',
    accentColor: '#F58220',
    unifiedProvider: 'zoho',
    meetingFormat: 'google_meet',
    smtpHost: 'smtp.zoho.com',
    smtpPort: 465,
    useSsl: true,
  },
  // Calendar providers
  {
    id: 'outlook-calendar',
    name: 'Microsoft Teams & Calendar',
    nangoConfigKey: 'outlook',
    category: 'calendar',
    typeLabel: 'Calendar Sync',
    tagline: 'Generates real Microsoft Teams interview links and checks Outlook free/busy',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    iconLetter: 'T',
    accentColor: '#5059C9',
    unifiedProvider: 'microsoft',
    meetingFormat: 'teams',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar & Meet',
    nangoConfigKey: 'google-calendar',
    category: 'calendar',
    typeLabel: 'Calendar Sync',
    tagline: 'Live Google Meet video rooms & automatic recruiter schedule conflict check',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconLetter: 'G',
    accentColor: '#34A853',
    unifiedProvider: 'google',
    meetingFormat: 'google_meet',
  },
  {
    id: 'google-meet',
    name: 'Google Meet',
    nangoConfigKey: 'google-calendar',
    category: 'calendar',
    typeLabel: 'Video Meetings',
    tagline: 'Live Google Meet HD video rooms & automatic interview room generation',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconLetter: 'M',
    accentColor: '#00897B',
    unifiedProvider: 'google',
    meetingFormat: 'google_meet',
  },
];

interface ConnectWorkAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  category?: ConnectCategory;
  initialProviderId?: string;
}

export const ConnectWorkAccountModal: React.FC<ConnectWorkAccountModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
  category = 'all',
  initialProviderId,
}) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<ConnectCategory>(category);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [connectionMethod, setConnectionMethod] = useState<'direct' | 'oauth'>('direct');
  const [isLoading, setIsLoading] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [authSuccessStep, setAuthSuccessStep] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string>('');
  const [lastAuthUrl, setLastAuthUrl] = useState<string | null>(null);

  // Direct Input Form State (Bypasses Microsoft / Google IT Admin Approval!)
  const [directName, setDirectName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directPassword, setDirectPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupPolling();
  }, []);

  // Sync category & initialProviderId props when opened
  useEffect(() => {
    setActiveFilter(category);
    if (initialProviderId) {
      setSelectedProviderId(initialProviderId);
    }
    // Auto-populate recruiter defaults
    if (user) {
      setDirectName(user.fullName || user.companyName || 'Recruiter');
      setDirectEmail(user.email || '');
    }
    setAuthInProgress(false);
    setAuthSuccessStep(false);
    cleanupPolling();
  }, [category, initialProviderId, open, user]);

  // Determine available providers based on current filter
  const displayedProviders = ALL_INTEGRATIONS.filter(p => {
    if (activeFilter === 'email') return p.category === 'email';
    if (activeFilter === 'calendar') return p.category === 'calendar' || p.id === 'microsoft-teams';
    if (activeFilter === 'meeting') return p.category === 'calendar' || p.id === 'google-meet' || p.id === 'microsoft-teams';
    return true;
  });

  // Default select first available provider
  useEffect(() => {
    if (displayedProviders.length > 0 && (!selectedProviderId || !displayedProviders.some(p => p.id === selectedProviderId))) {
      setSelectedProviderId(displayedProviders[0].id);
    }
  }, [displayedProviders, selectedProviderId]);

  const selectedProvider = ALL_INTEGRATIONS.find(p => p.id === selectedProviderId) || displayedProviders[0];

  // ==========================================
  // DIRECT WORK MAILBOX SETUP (NO IT ADMIN APPROVAL NEEDED!)
  // ==========================================
  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEmail.trim() || !directEmail.includes('@')) {
      showError('Please enter a valid work email address');
      return;
    }

    setIsLoading(true);

    try {
      const existing = getConnectedAccount(user?.id);
      const isEmail = selectedProvider.category === 'email' || activeFilter === 'email';
      const isCalendar = selectedProvider.category === 'calendar' || activeFilter === 'calendar';
      const isMeeting = activeFilter === 'meeting' || selectedProvider.id === 'microsoft-teams' || selectedProvider.id === 'google-meet';

      const resolvedHost = selectedProvider.smtpHost || (
        selectedProvider.unifiedProvider === 'google'
          ? 'smtp.gmail.com'
          : selectedProvider.unifiedProvider === 'zoho'
            ? 'smtp.zoho.com'
            : 'smtp.office365.com'
      );
      const resolvedPort = selectedProvider.smtpPort || (selectedProvider.unifiedProvider === 'microsoft' ? 587 : 465);
      const resolvedSsl = selectedProvider.useSsl ?? (selectedProvider.unifiedProvider !== 'microsoft');

      const updatedAccount: ConnectedRecruiterAccount = {
        id: existing?.id || `rec-acc-${Date.now()}`,
        user_id: user?.id,
        recruiter_name: directName.trim() || directEmail.split('@')[0],
        email: directEmail.trim().toLowerCase(),
        provider: selectedProvider.unifiedProvider,
        connected_at: new Date().toISOString(),
        status: 'active',
        email_sync: {
          enabled: isEmail ? true : Boolean(existing?.email_sync?.enabled),
          smtp_host: resolvedHost,
          smtp_port: resolvedPort,
          use_ssl: resolvedSsl,
          password: directPassword.trim(),
          last_synced: new Date().toISOString(),
        },
        calendar_sync: {
          enabled: isCalendar ? true : Boolean(existing?.calendar_sync?.enabled),
          default_format: selectedProvider.meetingFormat || existing?.calendar_sync?.default_format || 'google_meet',
          calendar_name: isCalendar ? `${selectedProvider.name} (Direct)` : (existing?.calendar_sync?.calendar_name || 'Primary Calendar'),
          meeting_room_prefix: '',
          last_synced: new Date().toISOString(),
        },
      };

      saveConnectedAccount(updatedAccount, user?.id);
      if (isMeeting || isCalendar) {
        connectVideoMeetingAccount(selectedProvider.meetingFormat || 'google_meet', user?.id);
      }

      // Sync to server-side integrations table so server-driven status and calendar events work
      const connId = `direct-${Date.now()}`;
      const prov = selectedProvider.unifiedProvider;
      const accEmail = directEmail.trim().toLowerCase();

      try {
        if (isEmail) {
          await apiFetch('/api/integrations', {
            method: 'POST',
            body: JSON.stringify({
              provider: prov,
              service: 'mail',
              connectionId: connId,
              accountEmail: accEmail,
            })
          });
        }
        if (isCalendar) {
          await apiFetch('/api/integrations', {
            method: 'POST',
            body: JSON.stringify({
              provider: prov,
              service: 'calendar',
              connectionId: connId,
              accountEmail: accEmail,
            })
          });
        }
        if (isMeeting || isCalendar) {
          await apiFetch('/api/integrations', {
            method: 'POST',
            body: JSON.stringify({
              provider: prov,
              service: 'meeting',
              connectionId: connId,
              accountEmail: accEmail,
            })
          });
        }
      } catch (intErr) {
        console.warn('Could not sync direct integration to server:', intErr);
      }

      setConnectedEmail(directEmail.trim());
      setIsLoading(false);
      setAuthSuccessStep(true);

      showSuccess(`Successfully connected ${selectedProvider.name} for ${directEmail.trim()}!`);

      setTimeout(() => {
        setAuthSuccessStep(false);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setIsLoading(false);
      showError(err?.message || 'Failed to connect work mailbox');
    }
  };

  // ==========================================
  // OAUTH SINGLE SIGN-ON (FOR PERSONAL / UNRESTRICTED TENANTS)
  // ==========================================
  const handleLaunchAuth = async () => {
    if (!selectedProvider) {
      showError('Please select an integration provider');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/nango/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(user?.id)
        },
        body: JSON.stringify({
          integration: selectedProvider.nangoConfigKey,
          category: activeFilter,
          userId: user?.id || 'guest',
          email: user?.email || '',
          recruiterName: user?.fullName || user?.companyName || 'Recruiter',
        }),
      });

      let sessionData: any = null;
      try {
        const text = await res.text();
        sessionData = text ? JSON.parse(text) : null;
      } catch (parseErr) {
        console.error("Failed to parse /api/nango/session response:", parseErr);
      }

      if (!res.ok || !sessionData) {
        setIsLoading(false);
        showError(sessionData?.error || sessionData?.message || `Server returned error (${res.status} ${res.statusText || 'Method Not Allowed'}). Please try again or use Company Work Email.`);
        return;
      }

      if (!sessionData.success || !sessionData.sessionToken) {
        setIsLoading(false);
        showError(sessionData.error || 'Could not initialize OAuth authorization session');
        return;
      }

      const directTargetUrl = sessionData.directAuthUrl || sessionData.connectLink;
      setLastAuthUrl(directTargetUrl);
      setAuthInProgress(true);
      setIsLoading(false);

      const popupWidth = 620;
      const popupHeight = 720;
      const left = window.screen.width / 2 - popupWidth / 2;
      const top = window.screen.height / 2 - popupHeight / 2;

      const authWindow = window.open(
        directTargetUrl,
        'HireForceDirectAuth',
        `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${popupWidth},height=${popupHeight},top=${top},left=${left}`
      );

      cleanupPolling();
      const checkAndComplete = async () => {
        try {
          const checkRes = await fetch(`/api/nango/check-connection?provider=${selectedProvider.nangoConfigKey}&category=${activeFilter}&userId=${encodeURIComponent(user?.id || '')}`, {
            headers: getAuthHeaders(user?.id)
          });
          if (!checkRes.ok) return;
          const checkText = await checkRes.text();
          const checkData = checkText ? JSON.parse(checkText) : null;
          if (checkData && checkData.connected) {
            cleanupPolling();
            if (authWindow && !authWindow.closed) {
              try { authWindow.close(); } catch { }
            }
            handleCompleteConnection(checkData);
          }
        } catch (e) { }
      };

      pollIntervalRef.current = setInterval(checkAndComplete, 1200);

      const handleFocus = () => {
        checkAndComplete();
      };
      window.addEventListener('focus', handleFocus, { once: true });

      if (!authWindow || authWindow.closed || typeof authWindow.closed === 'undefined') {
        showError('Popup blocked by browser. Please click the direct authorization link below.');
      }
    } catch (err: any) {
      setIsLoading(false);
      showError(err?.message || 'Failed to initialize authorization');
    }
  };

  const handleManualCheck = async () => {
    setIsLoading(true);
    try {
      const checkRes = await fetch(`/api/nango/check-connection?provider=${selectedProvider?.nangoConfigKey}&category=${activeFilter}&userId=${encodeURIComponent(user?.id || '')}`, {
        headers: getAuthHeaders(user?.id)
      });
      let checkData: any = null;
      try {
        const text = await checkRes.text();
        checkData = text ? JSON.parse(text) : null;
      } catch { }
      setIsLoading(false);
      if (checkData && checkData.connected) {
        cleanupPolling();
        handleCompleteConnection(checkData);
      } else {
        showError('No active authorization detected yet. If your organization blocked it with "Need admin approval", switch to Direct Setup.');
      }
    } catch (e: any) {
      setIsLoading(false);
      showError('Failed to verify connection: ' + e.message);
    }
  };

  const handleCompleteConnection = async (verifiedData?: any) => {
    cleanupPolling();
    const existing = getConnectedAccount(user?.id);
    const isEmail = selectedProvider.category === 'email' || activeFilter === 'email';
    const isCalendar = selectedProvider.category === 'calendar' || activeFilter === 'calendar';
    const isMeeting = activeFilter === 'meeting' || selectedProvider.id === 'microsoft-teams' || selectedProvider.id === 'google-meet';

    const realEmail = verifiedData?.email || existing?.email || user?.email || 'connected@recruiter.ai';
    const realName = verifiedData?.recruiterName || existing?.recruiter_name || user?.fullName || realEmail.split('@')[0];

    const updatedAccount: ConnectedRecruiterAccount = {
      id: existing?.id || `rec-acc-${Date.now()}`,
      user_id: user?.id,
      recruiter_name: realName,
      email: realEmail,
      provider: selectedProvider.unifiedProvider,
      connected_at: new Date().toISOString(),
      status: 'active',
      email_sync: {
        enabled: isEmail ? true : Boolean(existing?.email_sync?.enabled),
        smtp_host: selectedProvider.id === 'zoho-mail' ? 'smtp.zoho.com' : selectedProvider.unifiedProvider === 'google' ? 'smtp.gmail.com' : 'smtp.office365.com',
        smtp_port: selectedProvider.unifiedProvider === 'microsoft' ? 587 : 465,
        use_ssl: selectedProvider.unifiedProvider !== 'microsoft',
        last_synced: new Date().toISOString(),
      },
      calendar_sync: {
        enabled: isCalendar ? true : Boolean(existing?.calendar_sync?.enabled),
        default_format: selectedProvider.meetingFormat || existing?.calendar_sync?.default_format || 'google_meet',
        calendar_name: isCalendar ? `${selectedProvider.name} (Primary)` : (existing?.calendar_sync?.calendar_name || 'Primary Calendar'),
        meeting_room_prefix: '',
        last_synced: new Date().toISOString(),
      },
    };

    saveConnectedAccount(updatedAccount, user?.id);
    if (isMeeting || isCalendar) {
      connectVideoMeetingAccount(selectedProvider.meetingFormat || 'google_meet', user?.id);
    }

    // Ensure server-side integration table is updated
    const connId = verifiedData?.connectionId || `oauth-${Date.now()}`;
    const prov = selectedProvider.unifiedProvider;
    const accEmail = realEmail;
    try {
      if (isEmail) {
        apiFetch('/api/integrations', {
          method: 'POST',
          body: JSON.stringify({
            provider: prov,
            service: 'mail',
            connectionId: connId,
            accountEmail: accEmail,
          })
        }).catch(() => {});
      }
      if (isCalendar) {
        apiFetch('/api/integrations', {
          method: 'POST',
          body: JSON.stringify({
            provider: prov,
            service: 'calendar',
            connectionId: connId,
            accountEmail: accEmail,
          })
        }).catch(() => {});
      }
      if (isMeeting || isCalendar) {
        apiFetch('/api/integrations', {
          method: 'POST',
          body: JSON.stringify({
            provider: prov,
            service: 'meeting',
            connectionId: connId,
            accountEmail: accEmail,
          })
        }).catch(() => {});
      }
    } catch {}

    setConnectedEmail(realEmail);
    setAuthInProgress(false);
    setAuthSuccessStep(true);

    showSuccess(`Successfully connected ${selectedProvider.name} (${realEmail})!`);

    setTimeout(() => {
      setAuthSuccessStep(false);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    }, 1200);
  };

  const getHeaderTitle = () => {
    if (activeFilter === 'email') return 'Connect Recruiter Email Mailbox';
    if (activeFilter === 'calendar') return 'Connect Recruiter Calendar & Video';
    if (activeFilter === 'meeting') return 'Connect Video Meetings (Microsoft Teams & Meet)';
    return 'HireForce AI Account Integration';
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { cleanupPolling(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg bg-white p-6 rounded-xl border border-zinc-200 shadow-xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Zap size={18} className="text-emerald-600 fill-emerald-600/20" />
              {getHeaderTitle()}
            </DialogTitle>
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
              Instant Setup
            </Badge>
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            Send candidate emails and interview invites from your corporate domain with zero IT blocks.
          </DialogDescription>
        </DialogHeader>

        {authSuccessStep ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 animate-in zoom-in-75">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Work Mailbox Connected!</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {selectedProvider?.name} is active for <strong>{connectedEmail}</strong>. Candidate correspondence will dispatch directly from your address.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* INTUITIVE RECRUITER-FRIENDLY METHOD SELECTOR */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConnectionMethod('direct')}
                className={cn(
                  "p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer",
                  connectionMethod === 'direct'
                    ? "bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500/30"
                    : "bg-white border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50/20"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                      <Building2 size={16} className="text-emerald-600" />
                      Company Work Email
                    </span>
                    <span className="text-[9px] font-extrabold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full tracking-wide shadow-2xs">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-snug">
                    Best for <strong>company accounts</strong> (Outlook 365, Google Workspace, Zoho). Works instantly with zero IT administrator permission needed.
                  </p>
                </div>
                {connectionMethod === 'direct' ? (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Selected (Guaranteed to bypass IT blocks)</span>
                  </div>
                ) : (
                  <div className="mt-2.5 pt-2 border-t border-zinc-100 text-[11px] font-medium text-zinc-400">
                    Click to choose this method
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setConnectionMethod('oauth')}
                className={cn(
                  "p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer",
                  connectionMethod === 'oauth'
                    ? "bg-blue-50/90 border-blue-500 shadow-sm ring-1 ring-blue-500/30"
                    : "bg-white border-zinc-200 hover:border-blue-300 hover:bg-blue-50/20"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
                      <Zap size={16} className="text-blue-600 fill-blue-600/20" />
                      1-Click Popup Login
                    </span>
                    <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                      Fast Login
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-snug">
                    Opens a standard popup window. Best for <strong>personal accounts</strong> or companies that have pre-approved third-party apps.
                  </p>
                </div>
                {connectionMethod === 'oauth' ? (
                  <div className="mt-2.5 pt-2 border-t border-blue-200 flex items-center gap-1.5 text-[11px] font-bold text-blue-800">
                    <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                    <span>Selected (Opens login popup)</span>
                  </div>
                ) : (
                  <div className="mt-2.5 pt-2 border-t border-zinc-100 text-[11px] font-medium text-zinc-400">
                    Click to choose this method
                  </div>
                )}
              </button>
            </div>

            {/* Provider Picker */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                Select Your Email / Calendar Provider:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {displayedProviders.map((p) => {
                  const isSelected = selectedProviderId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProviderId(p.id)}
                      className={cn(
                        "flex flex-col items-center p-2.5 rounded-lg border text-center transition-all relative cursor-pointer",
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500 shadow-xs"
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                      )}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white mb-1 shadow-2xs"
                        style={{ backgroundColor: p.accentColor }}
                      >
                        {p.iconLetter}
                      </div>
                      <span className="text-[11px] font-bold text-zinc-800 truncate w-full">{p.name.split('/')[0]}</span>
                      <span className="text-[9px] text-zinc-400 mt-0.5 truncate w-full">{p.typeLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MODE 1: COMPANY WORK EMAIL SETUP (DIRECT & NO IT ADMIN PERMISSION REQUIRED) */}
            {connectionMethod === 'direct' ? (
              <form onSubmit={handleDirectConnect} className="space-y-3.5 pt-1">
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>Works for Any Corporate Email Domain</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1 text-[11px] text-emerald-800">
                    <div className="flex items-center gap-1">
                      <Check size={12} className="text-emerald-600 shrink-0" strokeWidth={3} />
                      <span>No IT Admin Required</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check size={12} className="text-emerald-600 shrink-0" strokeWidth={3} />
                      <span>No "Need Admin Approval"</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check size={12} className="text-emerald-600 shrink-0" strokeWidth={3} />
                      <span>Sends from Your Real Address</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-zinc-700">Your Full Name *</Label>
                    <Input
                      type="text"
                      value={directName}
                      onChange={(e) => setDirectName(e.target.value)}
                      placeholder="e.g. Jennifer Collins"
                      className="h-8.5 text-xs bg-white border-zinc-200"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-zinc-700">Your Work Email Address *</Label>
                    <Input
                      type="email"
                      value={directEmail}
                      onChange={(e) => setDirectEmail(e.target.value)}
                      placeholder="e.g. jennifer@granddiesigns.com"
                      className="h-8.5 text-xs bg-white font-mono border-zinc-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-zinc-700">
                      Work Email Password or App Password *
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowHelpGuide(!showHelpGuide)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <HelpCircle size={13} className="text-emerald-600" />
                      {showHelpGuide ? 'Hide Password Guide' : 'How to get an App Password (30 sec)?'}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={directPassword}
                      onChange={(e) => setDirectPassword(e.target.value)}
                      placeholder="Enter your email password or 16-character App Password"
                      className="h-8.5 text-xs bg-white font-mono pr-8 border-zinc-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    💡 If your work account has 2-step verification (phone code), click the guide above to create a quick 16-letter App Password.
                  </p>
                </div>

                {/* Collapsible 20-second help accordion */}
                {showHelpGuide && (
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] text-zinc-700 space-y-2 animate-in fade-in">
                    <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-500" />
                      Quick 30-Second Guide to Generate an App Password:
                    </div>

                    {selectedProvider.unifiedProvider === 'microsoft' && (
                      <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-zinc-200">
                        <p className="font-semibold text-blue-700">For Microsoft 365 / Outlook Work Accounts:</p>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-600 pl-0.5">
                          <li>Open <a href="https://account.microsoft.com/security" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold underline">account.microsoft.com/security</a></li>
                          <li>Click on <strong>Advanced Security Options</strong> ➔ <strong>App Passwords</strong>.</li>
                          <li>Click <strong>Create a new app password</strong>, copy the password and paste it above!</li>
                        </ol>
                      </div>
                    )}

                    {selectedProvider.unifiedProvider === 'google' && (
                      <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-zinc-200">
                        <p className="font-semibold text-red-700">For Google Workspace / Gmail:</p>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-600 pl-0.5">
                          <li>Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-red-600 font-semibold underline">myaccount.google.com/apppasswords</a></li>
                          <li>Type app name <strong>HireForce</strong> and click <strong>Create</strong>.</li>
                          <li>Copy the 16-character code and paste it above!</li>
                        </ol>
                      </div>
                    )}

                    {selectedProvider.unifiedProvider === 'zoho' && (
                      <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-zinc-200">
                        <p className="font-semibold text-amber-700">For Zoho Mail:</p>
                        <ol className="list-decimal list-inside space-y-1 text-zinc-600 pl-0.5">
                          <li>Go to <strong>Zoho Accounts</strong> ➔ <strong>Security</strong> ➔ <strong>Application Passwords</strong>.</li>
                          <li>Generate a password for <strong>HireForce</strong> and paste it above!</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-9.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs gap-1.5 rounded-lg cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        Connecting Work Mailbox...
                      </>
                    ) : (
                      <>
                        <Check size={14} strokeWidth={3} />
                        Connect My Work Email Now
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* MODE 2: POPUP LOGIN (FOR PERSONAL / PRE-APPROVED ACCOUNTS) */
              <div className="space-y-3 pt-1">
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle size={15} className="text-amber-600 shrink-0" />
                    <span>Notice for Corporate Domains</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    If your screen displays <strong>"Need admin approval"</strong>, switch to the <strong>Company Work Email</strong> option above to connect immediately without waiting for your IT administrator.
                  </p>
                </div>

                {authInProgress ? (
                  <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg space-y-2 animate-in fade-in">
                    <div className="flex items-start gap-2 text-cyan-900">
                      <RefreshCw size={15} className="animate-spin text-cyan-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-semibold">Direct sign-in popup opened</p>
                        <p className="text-[11px] text-cyan-700 mt-0.5">
                          Waiting for you to authorize in the popup window.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {lastAuthUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(lastAuthUrl, '_blank')}
                          className="h-7 text-[11px] text-cyan-800 border-cyan-300 bg-white hover:bg-cyan-100/50 flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink size={11} /> Re-open Popup
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleManualCheck}
                        disabled={isLoading}
                        className="h-7 text-[11px] bg-cyan-600 hover:bg-cyan-700 text-white font-medium cursor-pointer"
                      >
                        Check Status Now
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={handleLaunchAuth}
                    disabled={isLoading}
                    className="w-full h-9 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs gap-1.5"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        Opening Authorization...
                      </>
                    ) : (
                      <>
                        <Zap size={14} className="text-amber-400" />
                        Sign In with {selectedProvider?.name} (OAuth)
                        <ArrowRight size={13} />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-zinc-100 pt-3">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Lock size={12} className="text-emerald-600" />
            <span>Zero IT admin dependency</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { cleanupPolling(); onOpenChange(false); }}
            className="text-xs h-8"
            disabled={isLoading}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
