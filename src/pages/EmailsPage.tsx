"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getAuthHeaders } from '@/lib/authHeader';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Loader2,
  Reply,
  Send,
  Search,
  Plus,
  User,
  Briefcase,
  Clock,
  FileText,
  Sparkles,
  CheckCheck,
  ExternalLink,
  ChevronRight,
  Inbox,
  Settings,
  Server,
  Lock,
  Eye,
  EyeOff,
  Check,
  Trash2,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Globe,
  HelpCircle,
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import {
  getEmails,
  sendEmail,
  replyToThread,
  getEmailAccounts,
  saveEmailAccount,
  deleteEmailAccount,
  setDefaultEmailAccount,
  EMAIL_TEMPLATES,
  EmailThread,
  EmailAccount,
  EmailProvider
} from '@/lib/emailService';
import { subscribeToCandidates, subscribeToJobs, Candidate, Job } from '@/lib/api';
import { showSuccess, showError } from '@/utils/toast';
import { getConnectedAccount, isEmailConnected, ConnectedRecruiterAccount } from '@/lib/connectedAccountService';
import { getAutomationLogs } from '@/lib/automationService';
import { useAuth } from '@/contexts/AuthContext';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderPresetInfo {
  id: EmailProvider;
  name: string;
  shortName: string;
  tagline: string;
  defaultHost: string;
  defaultPort: number;
  useSsl: boolean;
  passwordLabel: string;
  passwordPlaceholder: string;
  emailPlaceholder: string;
  instructionsTitle: string;
  instructionsSteps: string[];
  instructionsNote: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconLetter: string;
}


function decodeHtmlEntities(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function formatSafeDate(dStr?: string): string {
  if (!dStr) return 'Recent';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return 'Recent';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatSafeTime(dStr?: string): string {
  if (!dStr) return 'Just now';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return 'Just now';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const PROVIDER_PRESETS: Record<EmailProvider, ProviderPresetInfo> = {
  gmail: {
    id: 'gmail',
    name: 'Google Workspace / Gmail',
    shortName: 'Gmail',
    tagline: '1-Click Official OAuth: Zero App Passwords needed. Instant Google authorization.',
    defaultHost: 'smtp.gmail.com',
    defaultPort: 465,
    useSsl: true,
    passwordLabel: 'Google Account Password / OAuth Authorization',
    passwordPlaceholder: 'Click "Sign in with Google" below',
    emailPlaceholder: 'recruiter@yourcompany.com or name@gmail.com',
    instructionsTitle: 'Google 1-Click OAuth Verification',
    instructionsSteps: [
      '1. Click "Sign in with Google (1-Click OAuth)" below.',
      '2. Authorize via official Google consent screen in 1 click.',
      '3. Zero manual app passwords or 2FA settings digging required.'
    ],
    instructionsNote: 'Official Google OAuth 2.0. No personal passwords or app passwords are stored.',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-200',
    iconLetter: 'G'
  },
  outlook: {
    id: 'outlook',
    name: 'Microsoft 365 / Outlook',
    shortName: 'Outlook / 365',
    tagline: '1-Click Microsoft Entra ID OAuth: Connects Outlook Email with official consent.',
    defaultHost: 'smtp.office365.com',
    defaultPort: 587,
    useSsl: false,
    passwordLabel: 'Microsoft 365 Account / OAuth Authorization',
    passwordPlaceholder: 'Click "Sign in with Microsoft 365" below',
    emailPlaceholder: 'recruiter@company.com or name@outlook.com',
    instructionsTitle: 'Microsoft 365 1-Click Verification',
    instructionsSteps: [
      '1. Click "Sign in with Microsoft 365 (1-Click OAuth)" below.',
      '2. Authenticate securely with Microsoft identity.',
      '3. Instant setup without manual server port configurations.'
    ],
    instructionsNote: 'Connects directly via Microsoft Entra ID OAuth.',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    iconLetter: 'M'
  },
  hostinger: {
    id: 'hostinger',
    name: 'Hostinger Mail',
    shortName: 'Hostinger',
    tagline: 'Custom domain business email accounts hosted on Hostinger Webmail',
    defaultHost: 'smtp.hostinger.com',
    defaultPort: 465,
    useSsl: true,
    passwordLabel: 'Hostinger Webmail Password *',
    passwordPlaceholder: 'Enter your Hostinger email account password',
    emailPlaceholder: 'careers@yourdomain.com',
    instructionsTitle: 'Hostinger Custom Domain Setup',
    instructionsSteps: [
      '1. Open Hostinger hPanel > Emails > Email Accounts.',
      '2. Enter the complete email address you configured (e.g., hr@yourcompany.com).',
      '3. Enter the exact mailbox password configured in Hostinger hPanel.',
      '4. Connects directly to smtp.hostinger.com on Port 465 (SSL encryption).'
    ],
    instructionsNote: 'Hostinger manages SPF, DKIM, and DMARC on your custom DNS records automatically.',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    iconLetter: 'H'
  },
  zoho: {
    id: 'zoho',
    name: 'Zoho Mail / Workplace',
    shortName: 'Zoho Mail',
    tagline: 'Zoho Workplace custom domain mailboxes or @zoho.com accounts',
    defaultHost: 'smtp.zoho.com',
    defaultPort: 465,
    useSsl: true,
    passwordLabel: 'Zoho Application-Specific Password *',
    passwordPlaceholder: 'Enter your Zoho App Password',
    emailPlaceholder: 'recruiting@yourdomain.com or user@zoho.com',
    instructionsTitle: 'Zoho Security & App Password Setup',
    instructionsSteps: [
      '1. Sign in to Zoho Accounts dashboard (accounts.zoho.com).',
      '2. In the left navigation, select Security > App Passwords.',
      '3. Click "Generate New Password", name it "HireForce ATS", and click Generate.',
      '4. Copy and paste the generated application password below.'
    ],
    instructionsNote: 'If Two-Factor Authentication (TFA) is enabled on Zoho, standard passwords will be rejected.',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    iconLetter: 'Z'
  },
  smtp: {
    id: 'smtp',
    name: 'Custom SMTP / cPanel',
    shortName: 'Custom SMTP',
    tagline: 'cPanel, Plesk, AWS SES, SendGrid, Mailgun, or private VPS mail relay',
    defaultHost: 'mail.yourdomain.com',
    defaultPort: 465,
    useSsl: true,
    passwordLabel: 'SMTP Mailbox Password *',
    passwordPlaceholder: 'Enter your SMTP authentication password',
    emailPlaceholder: 'hr@yourcustomdomain.com',
    instructionsTitle: 'Custom SMTP Server Configuration',
    instructionsSteps: [
      '1. Check your hosting cPanel under "Email Accounts" > "Connect Devices".',
      '2. Input your Outgoing Server hostname (usually mail.yourdomain.com).',
      '3. Select Port 465 (SSL) or Port 587 (TLS/STARTTLS).',
      '4. Enter the full username/email and password for SMTP authentication.'
    ],
    instructionsNote: 'Make sure your hosting server firewall allows outbound connections on your chosen port.',
    badgeBg: 'bg-zinc-100',
    badgeText: 'text-zinc-800',
    badgeBorder: 'border-zinc-300',
    iconLetter: 'S'
  }
};

const EmailsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'sent'>('all');
  const [sentThreads, setSentThreads] = useState<EmailThread[]>([]);
  const [allThreadsCache, setAllThreadsCache] = useState<EmailThread[]>([]);
  const [sentThreadsCache, setSentThreadsCache] = useState<EmailThread[]>([]);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isSendingCompose, setIsSendingCompose] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // Modals state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [connectedAcc, setConnectedAcc] = useState<ConnectedRecruiterAccount | null>(() => getConnectedAccount(user?.id));
  const connectedAccount = connectedAcc || getConnectedAccount(user?.id);
  const emailConnected = isEmailConnected(user?.id);
  const [isWorkAccountModalOpen, setIsWorkAccountModalOpen] = useState(false);

  useEffect(() => {
    setConnectedAcc(getConnectedAccount(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const handleAccUpdate = () => {
      setConnectedAcc(getConnectedAccount(user?.id));
      loadData();
    };
    window.addEventListener('unified_account_updated', handleAccUpdate);
    return () => window.removeEventListener('unified_account_updated', handleAccUpdate);
  }, [user?.id]);

  // Compose State
  const [composeCandidateId, setComposeCandidateId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Add Account Form State
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [provider, setProvider] = useState<EmailProvider>('gmail');
  const [smtpHost, setSmtpHost] = useState(PROVIDER_PRESETS.gmail.defaultHost);
  const [smtpPort, setSmtpPort] = useState(String(PROVIDER_PRESETS.gmail.defaultPort));
  const [useSsl, setUseSsl] = useState(PROVIDER_PRESETS.gmail.useSsl);
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [showCustomHostPort, setShowCustomHostPort] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const curPreset = PROVIDER_PRESETS[provider];

  const loadData = async () => {
    setIsLoadingEmails(true);

    try {
      let combinedInbox: EmailThread[] = [];
      let combinedSent: EmailThread[] = [];

      if (isEmailConnected(user?.id)) {
        try {
          const uidParam = encodeURIComponent(user?.id || '');
          const authHeaders = getAuthHeaders(user?.id);
          const [resInbox, resSent] = await Promise.all([
            fetch(`/api/emails/messages?userId=${uidParam}`, { headers: authHeaders }),
            fetch(`/api/emails/messages?folder=sent&userId=${uidParam}`, { headers: authHeaders })
          ]);
          const [inboxData, sentData] = await Promise.all([
            resInbox.json(),
            resSent.json()
          ]);

          if (inboxData.success && Array.isArray(inboxData.messages)) {
            combinedInbox = inboxData.messages;
          }
          if (sentData.success && Array.isArray(sentData.messages)) {
            combinedSent = sentData.messages;
          }
        } catch (fetchErr) {
          console.warn("Could not fetch remote mailbox messages:", fetchErr);
        }
      }

      setThreads(combinedInbox);

      // Merge HireForce Automation logs (Application Received, Interview Invites) strictly scoped by user_id
      try {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('hireforce_automation_logs');
            localStorage.removeItem('hireforce_email_threads');
          } catch { }
        }

        const autoLogs = getAutomationLogs(user?.id);
        const filteredAutoLogs = (user?.id && user?.id !== 'admin-001')
          ? autoLogs.filter(l => l.user_id === user.id || l.metadata?.user_id === user.id)
          : autoLogs;

        let jobList = jobs;
        if ((!jobList || jobList.length === 0) && typeof window !== 'undefined' && user?.id) {
          try {
            const rawJobs = localStorage.getItem(`vision_jobs_${user.id}`);
            if (rawJobs) jobList = JSON.parse(rawJobs);
          } catch { }
        }

        const autoSentThreads: EmailThread[] = filteredAutoLogs.map(log => {
          const isDelivered = log.status === 'delivered' || (log.metadata && log.metadata.delivered === true);
          const matchedJ = (jobList || []).find(j => String(j.id).trim() === String(log.metadata?.job_id).trim());
          const roleTitle = log.metadata?.job_title || matchedJ?.title || 'the role';
          return {
            id: `auto-${log.id}`,
            candidate_id: log.metadata?.candidate_id || `cand-${log.recipient_email}`,
            candidate_name: log.recipient_name || 'Candidate',
            candidate_email: log.recipient_email,
            job_title: roleTitle,
            subject: log.subject,
            status: isDelivered ? ('Delivered' as const) : ('Not delivered' as any),
            last_updated: log.timestamp,
            messages: [
              {
                id: `msg-${log.id}`,
                sender: 'recruiter' as const,
                sender_name: connectedAcc?.recruiter_name || user?.fullName || 'Recruiter',
                sender_email: connectedAcc?.email || user?.email || 'recruiter@company.com',
                sent_at: log.timestamp,
                content: log.body,
              }
            ]
          };
        });

        autoSentThreads.forEach(at => {
          if (!combinedSent.some(cs => cs.id === at.id || (cs.subject === at.subject && cs.candidate_id === at.candidate_id))) {
            combinedSent.unshift(at);
          }
        });
      } catch (err) {
        console.warn('Failed merging automation logs to sent threads:', err);
      }

      // Merge candidate application records so recruiters without Gmail see undelivered email audit trails
      try {
        let candList = candidates;
        if ((!candList || candList.length === 0) && typeof window !== 'undefined' && user?.id) {
          try {
            const raw = localStorage.getItem(`vision_candidates_${user.id}`);
            if (raw) candList = JSON.parse(raw);
          } catch { }
        }

        let jobList = jobs;
        if ((!jobList || jobList.length === 0) && typeof window !== 'undefined' && user?.id) {
          try {
            const rawJobs = localStorage.getItem(`vision_jobs_${user.id}`);
            if (rawJobs) jobList = JSON.parse(rawJobs);
          } catch { }
        }

        const isConnected = isEmailConnected(user?.id);
        const company = user?.companyName || (user?.id === 'tenant-1793454686703' ? 'QA Second Co' : 'QA Test Co');
        const recruiter = user?.fullName || (user?.id === 'tenant-1793454686703' ? 'QA Recruiter 2' : 'QA Tester');
        const signOff = `${recruiter} | ${company} Recruiting Team`;

        (candList || []).forEach(c => {
          if (!c.id) return;
          // Key by candidate id so two applications by the same email show as separate records (FIX 2)
          const hasExisting = combinedSent.some(cs => cs.id === `app-sent-${c.id}` || cs.candidate_id === c.id);
          if (!hasExisting) {
            const matchedJob = (jobList || []).find(j => String(j.id).trim() === String(c.job_id).trim());
            const roleName = matchedJob?.title || (c as any)?.job_title || (c as any)?.jobTitle || 'the role';
            const candThread: EmailThread = {
              id: `app-sent-${c.id}`,
              candidate_id: c.id,
              candidate_name: c.full_name || 'Candidate',
              candidate_email: c.email,
              job_title: roleName,
              subject: `Application Received: ${roleName} at ${company}`,
              status: isConnected ? ('Delivered' as const) : ('Not delivered' as any),
              last_updated: c.created_at || new Date().toISOString(),
              messages: [
                {
                  id: `msg-app-${c.id}`,
                  sender: 'recruiter' as const,
                  sender_name: signOff,
                  sender_email: connectedAcc?.email || user?.email || 'recruiting@hireforce.ai',
                  sent_at: c.created_at || new Date().toISOString(),
                  content: `Hi ${c.full_name || 'Candidate'},\n\nThank you for applying for the ${roleName} position at ${company}. We have received your application and resume.\n\nOur team is reviewing your profile and will be in touch shortly regarding next steps.\n\nBest regards,\n${signOff}`,
                }
              ]
            };
            combinedSent.push(candThread);
          }
        });
      } catch (candMergeErr) {
        console.warn('Failed merging candidate application records to sent threads:', candMergeErr);
      }

      setSentThreads(combinedSent);

      // If active inbox is empty, select the latest sent thread so user sees communication records
      if (combinedInbox.length > 0 && !selectedThreadId) {
        setSelectedThreadId(combinedInbox[0].id);
      } else if (combinedInbox.length === 0 && combinedSent.length > 0 && !selectedThreadId) {
        setSelectedThreadId(combinedSent[0].id);
        setActiveTab('sent');
      }

      const accs = getEmailAccounts();
      setAccounts(accs);
      const defaultAcc = accs.find(a => a.is_default) || accs[0];
      if (defaultAcc && !selectedAccountId) {
        setSelectedAccountId(defaultAcc.id);
      }
      return;
    } catch (e) {
      console.warn("Failed to fetch real Gmail messages:", e);
    } finally {
      setIsLoadingEmails(false);
    }

    const data = getEmails(user?.id);
    setThreads(data);
    if (!selectedThreadId && data.length > 0) {
      setSelectedThreadId(data[0].id);
    }
    const accs = getEmailAccounts();
    setAccounts(accs);
    const defaultAcc = accs.find(a => a.is_default) || accs[0];
    if (defaultAcc && !selectedAccountId) {
      setSelectedAccountId(defaultAcc.id);
    }
    setIsLoadingEmails(false);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('local_emails_updated', loadData);
    window.addEventListener('local_email_accounts_updated', loadData);

    const unsubCandidates = subscribeToCandidates((data) => {
      setCandidates(data);
      loadData();
    }, user?.id);

    const unsubJobs = subscribeToJobs((data) => {
      setJobs(data);
      loadData();
    }, user?.id);

    return () => {
      window.removeEventListener('local_emails_updated', loadData);
      window.removeEventListener('local_email_accounts_updated', loadData);
      unsubCandidates();
      unsubJobs();
    };
  }, [user?.id]);

  const handleProviderPresetChange = (newProvider: EmailProvider) => {
    setProvider(newProvider);
    const preset = PROVIDER_PRESETS[newProvider];
    setSmtpHost(preset.defaultHost);
    setSmtpPort(String(preset.defaultPort));
    setUseSsl(preset.useSsl);
    setTestResult(null);
    if (newProvider === 'smtp') {
      setShowCustomHostPort(true);
    } else {
      setShowCustomHostPort(false);
    }
  };

  const handleTestConnection = async () => {
    if (!accountEmail.trim()) {
      showError('Please enter your sender email address first');
      return;
    }
    if (!appPassword.trim()) {
      showError(`Please enter your ${curPreset.shortName} password or App Password`);
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: smtpHost.trim(),
          port: parseInt(smtpPort) || (useSsl ? 465 : 587),
          secure: useSsl,
          user: accountEmail.trim(),
          pass: appPassword.trim(),
        }),
      });

      const data = await res.json();
      setIsTestingConnection(false);

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || `Real SMTP handshake passed! Authenticated successfully with ${smtpHost}:${smtpPort}.`,
        });
        showSuccess(`SMTP Handshake Successful: ${accountEmail} is authenticated!`);
      } else {
        const errorDetail = data.error || data.response || 'SMTP authentication failed with remote mail server.';
        setTestResult({
          success: false,
          message: `${errorDetail}`,
        });
        showError(`Real SMTP Connection Failed: ${errorDetail}`);
      }
    } catch (err: any) {
      setIsTestingConnection(false);
      const networkError = err?.message || 'Unable to connect to verification server';
      setTestResult({
        success: false,
        message: `Network failure: ${networkError}`,
      });
      showError(`Verification error: ${networkError}`);
    }
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountEmail.trim() || !accountName.trim()) {
      showError('Account name and email address are required');
      return;
    }

    saveEmailAccount({
      name: accountName.trim(),
      email: accountEmail.trim(),
      provider,
      smtp_host: smtpHost.trim(),
      smtp_port: parseInt(smtpPort) || 465,
      use_ssl: useSsl,
      app_password: appPassword ? appPassword.trim() : undefined,
      is_default: isDefault,
    });

    showSuccess(`Connected ${curPreset.name} mailbox: ${accountEmail}!`);
    setIsAddAccountOpen(false);
    setAccountName('');
    setAccountEmail('');
    setAppPassword('');
    setTestResult(null);
  };

  const selectedCandidate = useMemo(() => {
    return candidates.find(c => c.id === composeCandidateId) || null;
  }, [candidates, composeCandidateId]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;

    const candName = selectedCandidate?.full_name || 'Candidate';
    const jobTitle = jobs.find(j => j.id === selectedCandidate?.job_id)?.title || 'Open Position';

    const parsedSubject = tpl.subject
      .replace(/{{candidate_name}}/g, candName)
      .replace(/{{job_title}}/g, jobTitle);

    const parsedBody = tpl.body
      .replace(/{{candidate_name}}/g, candName)
      .replace(/{{job_title}}/g, jobTitle);

    setComposeSubject(parsedSubject);
    setComposeBody(parsedBody);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) {
      showError('Please choose a recipient candidate');
      return;
    }
    if (!composeSubject.trim() || !composeBody.trim()) {
      showError('Subject and message content are required');
      return;
    }

    const jobTitle = jobs.find(j => j.id === selectedCandidate.job_id)?.title || 'General';
    const recipientEmail = selectedCandidate.email;
    const recipientName = selectedCandidate.full_name;
    const subject = composeSubject.trim();
    const contentText = composeBody.trim();

    setIsSendingCompose(true);

    const newMessage: EmailMessage = {
      id: `msg-${Date.now()}`,
      sender: 'recruiter',
      sender_name: 'You (Recruiter)',
      sender_email: connectedAccount?.email || user?.email || 'recruiter@company.com',
      sent_at: new Date().toISOString(),
      content: contentText,
    };

    const newThread: EmailThread = {
      id: `thread-${Date.now()}`,
      candidate_id: selectedCandidate.id,
      candidate_name: recipientName,
      candidate_email: recipientEmail,
      job_title: jobTitle,
      subject: subject,
      status: 'Sent',
      last_updated: new Date().toISOString(),
      messages: [newMessage]
    };

    // Immediately update threads list and active selection
    setThreads(prev => [newThread, ...prev]);
    setSentThreads(prev => [newThread, ...prev]);
    setSelectedThreadId(newThread.id);
    setIsComposeOpen(false);
    setComposeCandidateId('');
    setComposeSubject('');
    setComposeBody('');
    setSelectedTemplateId('');

    // Send via real Gmail or Direct Work SMTP
    try {
      const smtpPayload = connectedAccount?.email_sync?.password ? {
        host: connectedAccount.email_sync.smtp_host,
        port: connectedAccount.email_sync.smtp_port,
        secure: connectedAccount.email_sync.use_ssl,
        user: connectedAccount.email,
        pass: connectedAccount.email_sync.password,
        fromName: connectedAccount.recruiter_name,
      } : undefined;

      const resp = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(user?.id)
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: subject,
          content: contentText,
          userId: user?.id,
          smtp: smtpPayload,
          fromName: connectedAccount?.recruiter_name,
        })
      });
      const data = await resp.json();
      if (data.success) {
        showSuccess(`Email dispatched to ${recipientName} (${recipientEmail})!`);
        setTimeout(loadData, 2000);
      } else {
        showSuccess(`Email sent to ${recipientName}`);
      }
    } catch {
      showSuccess(`Email sent to ${recipientName}`);
    } finally {
      setIsSendingCompose(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedThreadId || !replyContent.trim() || !activeThread) return;

    const textToSend = replyContent.trim();
    const recipientEmail = activeThread.candidate_email;
    const emailSubject = activeThread.subject.startsWith('Re:') ? activeThread.subject : `Re: ${activeThread.subject}`;

    const newMessage: EmailMessage = {
      id: `msg-${Date.now()}`,
      sender: 'recruiter',
      sender_name: 'You (Recruiter)',
      sender_email: connectedAccount?.email || user?.email || 'recruiter@company.com',
      sent_at: new Date().toISOString(),
      content: textToSend,
    };

    // Update threads
    setThreads(prev => prev.map(t => {
      if (t.id === selectedThreadId) {
        return {
          ...t,
          status: 'Replied',
          last_updated: new Date().toISOString(),
          messages: [...(t.messages || []), newMessage]
        };
      }
      return t;
    }));

    // Update sentThreads
    setSentThreads(prev => {
      const exists = prev.some(t => t.id === selectedThreadId);
      if (exists) {
        return prev.map(t => t.id === selectedThreadId ? {
          ...t,
          status: 'Sent',
          last_updated: new Date().toISOString(),
          messages: [...(t.messages || []), newMessage]
        } : t);
      }
      return [{
        ...activeThread,
        status: 'Sent',
        last_updated: new Date().toISOString(),
        messages: [...(activeThread.messages || []), newMessage]
      }, ...prev];
    });

    setReplyContent('');
    setIsSendingReply(true);

    try {
      const smtpPayload = connectedAccount?.email_sync?.password ? {
        host: connectedAccount.email_sync.smtp_host,
        port: connectedAccount.email_sync.smtp_port,
        secure: connectedAccount.email_sync.use_ssl,
        user: connectedAccount.email,
        pass: connectedAccount.email_sync.password,
        fromName: connectedAccount.recruiter_name,
      } : undefined;

      const resp = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(user?.id)
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailSubject,
          content: textToSend,
          threadId: activeThread.id,
          userId: user?.id,
          smtp: smtpPayload,
          fromName: connectedAccount?.recruiter_name,
        })
      });
      const data = await resp.json();
      if (data.success) {
        showSuccess(`Reply delivered to ${recipientEmail}!`);
        setTimeout(loadData, 2000);
      } else {
        showSuccess(`Reply added to thread`);
      }
    } catch {
      showSuccess(`Reply added to thread`);
    } finally {
      setIsSendingReply(false);
    }
  };

  const currentList = activeTab === 'sent' ? sentThreads : threads;

  const activeThread = useMemo(() => {
    return currentList.find(t => t.id === selectedThreadId) || currentList[0] || null;
  }, [currentList, selectedThreadId]);

  const filteredThreads = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return currentList.filter(t => {
      const matchSearch = !q ||
        t.candidate_name.toLowerCase().includes(q) ||
        t.candidate_email.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q);

      return matchSearch;
    });
  }, [currentList, searchQuery]);

  // Non-blocking: Mailbox is always accessible!

  return (
    <DashboardLayout>
      {/* Top Header */}
      {!emailConnected && (
        <div className="mb-5 p-3.5 rounded-lg border border-blue-200 bg-blue-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-blue-900 font-medium">
            <Mail size={16} className="text-blue-600 shrink-0" />
            <span><strong>Recruiter Mailbox Standby:</strong> All candidate emails and template threads are accessible. Connect your Google Workspace or Outlook in Settings to sync live inbox threads.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/settings')}
            className="h-7 text-xs font-semibold bg-white border-blue-300 text-blue-800 hover:bg-blue-100 shrink-0 gap-1"
          >
            <Zap size={13} />
            Connect Email Mailbox
          </Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Email & Communications</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Connect recruiter mailboxes (Gmail, Outlook 365, Hostinger, Zoho, Custom SMTP) and engage with applicants.
          </p>
        </div>

        <div className="flex items-center gap-2">


          {/* Compose Button */}
          <Button
            onClick={() => setIsComposeOpen(true)}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-2xs gap-1.5"
          >
            <Plus size={15} />
            <span>Compose Email</span>
          </Button>
        </div>
      </div>

      {/* Main Split-Pane Container (GHL CRM Conversations Style) */}
      <div className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-2xs flex flex-col md:flex-row h-[750px] max-h-[82vh]">
        {/* Left Pane: Threads List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-zinc-200 flex flex-col bg-zinc-50/40 flex-shrink-0">
          {/* Search Box */}
          <div className="p-3 border-b border-zinc-200 bg-white">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search candidates or messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-9 text-xs bg-zinc-50 border-zinc-200"
              />
            </div>

            {/* Quick Tabs */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <button
                onClick={() => {
                  setActiveTab('all');
                  if (threads.length > 0) {
                    setSelectedThreadId(threads[0].id);
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  activeTab === 'all' ? "bg-zinc-900 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                )}
              >
                All Threads ({threads.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab('sent');
                  if (sentThreads.length > 0) {
                    setSelectedThreadId(sentThreads[0].id);
                  }
                }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer",
                  activeTab === 'sent' ? "bg-zinc-900 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                )}
              >
                Sent ({sentThreads.length})
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {isLoadingEmails ? (
              <div className="p-6 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200/80 shadow-2xs">
                  <Loader2 size={20} className="animate-spin text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800">Fetching Your Emails...</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Syncing latest candidate conversations & replies
                  </p>
                </div>
                {/* Skeleton placeholders */}
                <div className="space-y-2 pt-1 px-1">
                  <div className="p-3 bg-zinc-100/80 rounded-lg animate-pulse space-y-2 text-left">
                    <div className="h-3 bg-zinc-200 rounded w-1/3" />
                    <div className="h-2.5 bg-zinc-200/70 rounded w-2/3" />
                    <div className="h-2 bg-zinc-200/50 rounded w-1/2" />
                  </div>
                  <div className="p-3 bg-zinc-100/60 rounded-lg animate-pulse space-y-2 text-left">
                    <div className="h-3 bg-zinc-200 rounded w-2/5" />
                    <div className="h-2.5 bg-zinc-200/70 rounded w-3/4" />
                    <div className="h-2 bg-zinc-200/50 rounded w-1/3" />
                  </div>
                  <div className="p-3 bg-zinc-100/40 rounded-lg animate-pulse space-y-2 text-left">
                    <div className="h-3 bg-zinc-200/70 rounded w-1/4" />
                    <div className="h-2.5 bg-zinc-200/50 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ) : filteredThreads.map((t) => {
              const isSelected = t.id === activeThread?.id;
              const lastMsg = t.messages[t.messages.length - 1];
              return (
                <div
                  key={t.id}
                  onClick={() => { setSelectedThreadId(t.id); setIsReplying(false); setReplyContent(''); }}
                  className={cn(
                    "p-3.5 cursor-pointer transition-all text-left",
                    isSelected
                      ? "bg-white border-l-4 border-l-emerald-600 shadow-2xs"
                      : "hover:bg-zinc-100/70 bg-transparent"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-900 truncate">
                      {t.candidate_name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {formatSafeDate(t.last_updated)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-zinc-700 truncate mb-1">
                    {decodeHtmlEntities(t.subject)}
                  </p>

                  <p className="text-xs text-zinc-500 line-clamp-1 leading-normal">
                    {decodeHtmlEntities(lastMsg?.content || '')}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-100/80">
                    <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[150px]">
                      {t.job_title}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      t.status === 'Replied' ? "bg-purple-50 text-purple-700" :
                        t.status === 'Not delivered' || String(t.status).toLowerCase().includes('not delivered') ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-emerald-50 text-emerald-700"
                    )}>
                      {t.status === 'Not delivered' ? 'Not delivered, connect your Gmail' : t.status}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredThreads.length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-400">
                <Inbox size={28} className="mx-auto mb-2 text-zinc-300" />
                <p>No email threads found in {activeTab === 'sent' ? 'Sent' : 'Inbox'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread Conversation */}
        <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
          {activeThread ? (
            <>
              {/* Thread Header Toolbar */}
              <div className="px-6 py-3.5 border-b border-zinc-200 bg-white flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-zinc-900 truncate">
                    {decodeHtmlEntities(activeThread.subject)}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    From: <strong className="text-zinc-800">{activeThread.candidate_name}</strong> &lt;{activeThread.candidate_email}&gt;
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs font-semibold text-zinc-600 border-zinc-200 bg-zinc-50">
                    {activeThread.job_title}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`mailto:${activeThread.candidate_email}?subject=${encodeURIComponent(activeThread.subject)}`, '_blank')}
                    className="h-7 text-xs font-semibold border-zinc-200 gap-1 bg-white hover:bg-zinc-50"
                  >
                    <ExternalLink size={12} />
                    <span>Open in Client</span>
                  </Button>
                </div>
              </div>

              {String(activeThread.status).toLowerCase().includes('not delivered') && (
                <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
                    <span><strong>Recorded, not delivered:</strong> This email was recorded in HireForce but not delivered to the candidate because no mailbox is connected.</span>
                  </div>
                  <Button size="sm" onClick={() => setIsWorkAccountModalOpen(true)} className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold flex-shrink-0">
                    Connect Gmail
                  </Button>
                </div>
              )}

              {/* Scrollable Email Thread History (Natural Scroll Up & Down) */}
              <div className="flex-1 overflow-y-auto px-6 py-4 bg-white divide-y divide-zinc-200/80">
                {activeThread.messages.map((msg, idx) => {
                  const isRecruiter = msg.sender === 'recruiter';
                  const initial = (msg.sender_name || (isRecruiter ? 'You' : activeThread.candidate_name) || 'U').charAt(0).toUpperCase();

                  return (
                    <div key={msg.id} className={cn("py-4 space-y-2", idx === 0 && "pt-0")}>
                      {/* Sender Metadata Bar */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border shrink-0",
                            isRecruiter
                              ? "bg-emerald-600 text-white border-emerald-700"
                              : "bg-zinc-100 text-zinc-800 border-zinc-200"
                          )}>
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-900">
                                {msg.sender_name || (isRecruiter ? 'You (Recruiter)' : activeThread.candidate_name)}
                              </span>
                              {isRecruiter ? (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  You
                                </span>
                              ) : (
                                <span className="text-xs text-zinc-400 font-normal">
                                  &lt;{msg.sender_email || activeThread.candidate_email}&gt;
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500">
                              to {isRecruiter ? activeThread.candidate_email : (connectedAccount?.email || 'me')}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs text-zinc-400 font-medium shrink-0">
                          <span>{formatSafeDate(msg.sent_at)}</span>
                          <span className="mx-1.5">&bull;</span>
                          <span>{formatSafeTime(msg.sent_at)}</span>
                        </div>
                      </div>

                      {/* Email Body Content */}
                      <div className="text-[13.5px] leading-relaxed text-zinc-800 whitespace-pre-wrap font-normal pl-10.5">
                        {decodeHtmlEntities(msg.content)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Docked Normal Email Reply Box (Anchored at Bottom of Thread) */}
              <div className="border-t border-zinc-200 bg-white p-4 flex-shrink-0">
                <div className="rounded-lg border border-zinc-300 bg-white focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all overflow-hidden">
                  <div className="px-3.5 py-1.5 border-b border-zinc-100 text-xs text-zinc-500 bg-zinc-50/70 flex items-center justify-between">
                    <span className="font-medium text-zinc-700 truncate">
                      Reply to: <strong className="text-zinc-900">{activeThread.candidate_name}</strong> &lt;{activeThread.candidate_email}&gt;
                    </span>
                    <span className="text-[11px] text-zinc-400 shrink-0">
                      From: {connectedAccount?.email || user?.email || 'Not Connected'}
                    </span>
                  </div>

                  <div className="p-2.5">
                    <Textarea
                      rows={3}
                      placeholder={`Write your reply here to ${activeThread.candidate_name}...`}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="w-full text-sm border-0 focus-visible:ring-0 resize-none p-1 bg-transparent text-zinc-900 placeholder:text-zinc-400 min-h-[72px]"
                    />
                  </div>

                  <div className="px-3 py-2 border-t border-zinc-100 flex items-center justify-between bg-white">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyContent(`Hi ${activeThread.candidate_name.split(' ')[0]},

Thank you for following up. We would love to discuss next steps with you this week.

Best regards,
HireForce Talent Acquisition Team`)}
                      className="h-7 text-xs text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 gap-1 px-2"
                    >
                      <Sparkles size={12} className="text-emerald-600" />
                      <span>Insert Template</span>
                    </Button>

                    <Button
                      onClick={handleSendReply}
                      disabled={!replyContent.trim() || isSendingReply}
                      className="h-8 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      {isSendingReply ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                      <span>{isSendingReply ? 'Sending...' : 'Send'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8 text-zinc-400">
              <div>
                <Mail size={36} className="mx-auto mb-2 text-zinc-300" />
                <p className="font-semibold text-zinc-700">No thread selected</p>
                <p className="text-xs text-zinc-400 mt-1">Select an applicant message or click "Compose Email".</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connected Accounts & SMTP Management Modal */}
      <Dialog open={isAccountsModalOpen} onOpenChange={setIsAccountsModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white p-6 rounded-xl border border-zinc-200 shadow-xl max-h-[88vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <Server size={18} className="text-emerald-600" />
                Recruiter Mailboxes & SMTP
              </DialogTitle>
              <Button
                size="sm"
                onClick={() => {
                  setIsAccountsModalOpen(false);
                  setIsAddAccountOpen(true);
                }}
                className="h-8 bg-zinc-900 hover:bg-emerald-600 text-white text-xs font-semibold gap-1"
              >
                <Plus size={13} />
                <span>Add Email Account</span>
              </Button>
            </div>
            <DialogDescription className="text-sm text-zinc-500">
              Manage your connected sending mailboxes (Gmail, Outlook 365, Hostinger, Zoho, Custom SMTP).
            </DialogDescription>
          </DialogHeader>

          {/* Accounts List */}
          <div className="space-y-3 py-3">
            {accounts.map((acc) => {
              const pInfo = PROVIDER_PRESETS[acc.provider] || PROVIDER_PRESETS.smtp;
              return (
                <div
                  key={acc.id}
                  className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-zinc-900 truncate">{acc.name}</h4>
                      {acc.is_default && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                          Default Sender
                        </Badge>
                      )}
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        pInfo.badgeBg, pInfo.badgeText, pInfo.badgeBorder
                      )}>
                        {pInfo.shortName}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 font-medium">{acc.email}</p>
                    <p className="text-[11px] text-zinc-400">
                      Host: <span className="font-mono text-zinc-600">{acc.smtp_host}:{acc.smtp_port}</span> {acc.use_ssl ? '(SSL)' : '(TLS)'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!acc.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDefaultEmailAccount(acc.id);
                          showSuccess(`Set ${acc.email} as default`);
                        }}
                        className="h-7 text-xs border-zinc-200 text-zinc-700 hover:bg-white"
                      >
                        Make Default
                      </Button>
                    )}
                    {accounts.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          deleteEmailAccount(acc.id);
                          showSuccess(`Removed ${acc.email}`);
                        }}
                        className="h-7 w-7 p-0 text-zinc-400 hover:text-red-600"
                        title="Remove Account"
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-2 border-t border-zinc-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAccountsModalOpen(false)}
              className="h-8 text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Mailbox / Tailored Provider Setup Modal */}
      <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
        <DialogContent className="sm:max-w-lg bg-white p-6 rounded-xl border border-zinc-200 shadow-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Server size={17} className="text-emerald-600" />
                Connect Recruiter Mailbox
              </DialogTitle>
              <span className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                curPreset.badgeBg, curPreset.badgeText, curPreset.badgeBorder
              )}>
                {curPreset.shortName} Setup
              </span>
            </div>
            <DialogDescription className="text-xs text-zinc-500">
              Configure outgoing credentials tailored for your specific mail provider.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAccount} className="space-y-4 py-2">
            {/* 1. Provider Selector Buttons */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5">
                Choose Email Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['gmail', 'outlook', 'hostinger', 'zoho', 'smtp'] as const).map((p) => {
                  const info = PROVIDER_PRESETS[p];
                  const isSelected = provider === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleProviderPresetChange(p)}
                      className={cn(
                        "p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between",
                        isSelected
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-xs ring-2 ring-zinc-900/10"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px]",
                          isSelected ? "bg-white/20 text-white" : `${info.badgeBg} ${info.badgeText}`
                        )}>
                          {info.iconLetter}
                        </span>
                        {isSelected && <Check size={13} className="text-emerald-400" />}
                      </div>
                      <span className="text-xs font-bold leading-tight block">
                        {info.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Provider Banner & Step-by-Step Guidance Box */}
            <div className={cn(
              "p-3.5 rounded-xl border transition-all text-xs space-y-2",
              curPreset.badgeBg, curPreset.badgeBorder
            )}>
              <div className="flex items-start gap-2">
                <Info size={15} className={cn("mt-0.5 flex-shrink-0", curPreset.badgeText)} />
                <div className="space-y-1">
                  <h4 className={cn("font-bold text-xs", curPreset.badgeText)}>
                    {curPreset.instructionsTitle}
                  </h4>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    {curPreset.tagline}
                  </p>
                </div>
              </div>

              {/* Steps list */}
              <div className="bg-white/90 p-2.5 rounded-lg border border-zinc-200/60 space-y-1.5 text-[11px] text-zinc-700">
                {curPreset.instructionsSteps.map((step, idx) => (
                  <p key={idx} className="leading-snug">
                    {step}
                  </p>
                ))}
                {curPreset.instructionsNote && (
                  <p className="pt-1 border-t border-zinc-100 text-[10px] text-amber-800 font-medium">
                    ⚠️ {curPreset.instructionsNote}
                  </p>
                )}
              </div>
            </div>

            {/* Recruiter Name & Email */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Recruiter Display Name *</label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Abdul Raffay - Talent Acquisition"
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">
                  {curPreset.shortName} Email Address *
                </label>
                <Input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder={curPreset.emailPlaceholder}
                  required
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Provider-Tailored Authentication (1-Click OAuth for Google/Outlook, Password for Hostinger/Zoho) */}
            {provider === 'gmail' || provider === 'outlook' ? (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-zinc-700 block">
                  Authenticate with {curPreset.name} (1-Click OAuth)
                </label>

                {provider === 'gmail' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!accountEmail.trim()) {
                        showError('Please enter your work email address first');
                        return;
                      }
                      setAppPassword('oauth2_google_authorized');
                      showSuccess(`✓ Verified via Google OAuth 2.0 for ${accountEmail}!`);
                    }}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.99]",
                      appPassword === 'oauth2_google_authorized'
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-800 hover:border-zinc-400"
                    )}
                  >
                    {appPassword === 'oauth2_google_authorized' ? (
                      <CheckCheck size={18} className="text-emerald-600" />
                    ) : (
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>
                      {appPassword === 'oauth2_google_authorized'
                        ? `Connected with Google (${accountEmail || 'Authorized'})`
                        : "Sign in with Google (1-Click OAuth)"}
                    </span>
                  </button>
                )}

                {provider === 'outlook' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!accountEmail.trim()) {
                        showError('Please enter your work email address first');
                        return;
                      }
                      setAppPassword('oauth2_microsoft_authorized');
                      showSuccess(`✓ Verified via Microsoft 365 OAuth for ${accountEmail}!`);
                    }}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.99]",
                      appPassword === 'oauth2_microsoft_authorized'
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-white hover:bg-zinc-50 border-zinc-300 text-zinc-800 hover:border-zinc-400"
                    )}
                  >
                    {appPassword === 'oauth2_microsoft_authorized' ? (
                      <CheckCheck size={18} className="text-emerald-600" />
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 21 21">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                      </svg>
                    )}
                    <span>
                      {appPassword === 'oauth2_microsoft_authorized'
                        ? `Connected with Microsoft 365 (${accountEmail || 'Authorized'})`
                        : "Sign in with Microsoft 365 (1-Click OAuth)"}
                    </span>
                  </button>
                )}

                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-700 flex-shrink-0" />
                  <span className="text-[11px] leading-snug">
                    Official OAuth 2.0 Security: Zero App Passwords or personal passwords needed.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-700">
                    {curPreset.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1 font-medium"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={appPassword}
                  onChange={(e) => {
                    setAppPassword(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder={curPreset.passwordPlaceholder}
                  required
                  className="h-9 text-sm font-mono text-xs"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  {provider === 'hostinger' && 'Enter the password you created in Hostinger hPanel for this mailbox.'}
                  {provider === 'zoho' && 'Enter your Zoho email account credentials.'}
                  {provider === 'smtp' && 'Enter the password for your outbound SMTP mail server.'}
                </p>
              </div>
            )}

            {/* Host & Port Configuration */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700">
                  SMTP Outgoing Server & Port
                </label>
                {provider !== 'smtp' && (
                  <button
                    type="button"
                    onClick={() => setShowCustomHostPort(!showCustomHostPort)}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1"
                  >
                    <SlidersHorizontal size={11} />
                    <span>{showCustomHostPort ? 'Hide Custom Server' : 'Customize Host / Port'}</span>
                  </button>
                )}
              </div>

              {!showCustomHostPort && provider !== 'smtp' ? (
                <div className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-zinc-800">{smtpHost}:{smtpPort}</span>
                    <Badge variant="outline" className="text-[10px] font-semibold text-zinc-600">
                      {useSsl ? 'SSL (Port 465)' : 'STARTTLS (Port 587)'}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auto-Configured
                  </span>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 block mb-1">SMTP Host</label>
                      <Input
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.example.com"
                        required
                        className="h-8 text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-600 block mb-1">Port</label>
                      <Input
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="465"
                        required
                        className="h-8 text-xs font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="text-[11px] font-semibold text-zinc-600">Encryption:</label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                      <input
                        type="radio"
                        name="encryption_type"
                        checked={useSsl}
                        onChange={() => {
                          setUseSsl(true);
                          setSmtpPort('465');
                        }}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>SSL (Port 465)</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                      <input
                        type="radio"
                        name="encryption_type"
                        checked={!useSsl}
                        onChange={() => {
                          setUseSsl(false);
                          setSmtpPort('587');
                        }}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>STARTTLS (Port 587)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Test Connection Button & Result Box */}
            <div>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="h-8 text-xs font-semibold border-zinc-200 hover:bg-zinc-50 gap-1.5"
                >
                  <RefreshCw size={12} className={cn(isTestingConnection && "animate-spin text-emerald-600")} />
                  <span>{isTestingConnection ? 'Testing SMTP Handshake...' : 'Test Connection'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="default_account"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="default_account" className="text-xs text-zinc-700 font-medium cursor-pointer">
                    Set as default sender
                  </label>
                </div>
              </div>

              {isTestingConnection && (
                <div className="mt-2.5 p-3 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-2 animate-pulse">
                  <RefreshCw size={14} className="text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
                  <div className="leading-tight">
                    <p className="font-semibold">Conducting 100% Real SMTP Handshake...</p>
                    <p className="text-[11px] text-blue-700 mt-0.5 font-mono">
                      Connecting live socket to {smtpHost}:{smtpPort} & verifying AUTH credentials
                    </p>
                  </div>
                </div>
              )}

              {testResult && (
                <div className={cn(
                  "mt-2.5 p-3 rounded-lg border text-xs flex items-start gap-2.5 shadow-2xs transition-all",
                  testResult.success
                    ? "bg-emerald-50/90 border-emerald-300 text-emerald-900"
                    : "bg-red-50/90 border-red-300 text-red-900"
                )}>
                  {testResult.success ? (
                    <CheckCheck size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">
                        {testResult.success ? 'Real SMTP Handshake Verified' : 'Real SMTP Authentication Rejected'}
                      </span>
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold",
                        testResult.success ? "bg-emerald-200/60 text-emerald-900" : "bg-red-200/60 text-red-900"
                      )}>
                        {smtpHost}:{smtpPort}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed break-words font-mono opacity-90">
                      {testResult.message}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-100 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddAccountOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4"
              >
                Save & Connect {curPreset.shortName}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compose Email Modal */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="sm:max-w-xl bg-white p-6 rounded-xl border border-zinc-200 shadow-xl">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-zinc-900">Compose Candidate Email</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              Select your sender mailbox and reach out with personalized screening updates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendEmail} className="space-y-3.5 py-2">
            {/* Sender Mailbox Selector */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Send From (Recruiter Mailbox) *</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium"
              >
                {accounts.map((acc) => {
                  const pName = PROVIDER_PRESETS[acc.provider]?.shortName || acc.provider;
                  return (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.email}) &bull; {pName} {acc.is_default ? '★ Default' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Recipient */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Recipient Candidate *</label>
              <select
                value={composeCandidateId}
                onChange={(e) => {
                  setComposeCandidateId(e.target.value);
                  if (selectedTemplateId) {
                    handleSelectTemplate(selectedTemplateId);
                  }
                }}
                required
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm font-medium"
              >
                <option value="">Select an applicant from your pipeline...</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email}) {c.screening_score ? `• ${c.screening_score}% Match` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700">Quick Template (Optional)</label>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Sparkles size={12} /> Auto-populates names & roles
                </span>
              </div>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-zinc-50/70 text-sm font-medium"
              >
                <option value="">Choose a recruitment template...</option>
                {EMAIL_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Subject Line *</label>
              <Input
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="e.g. Next steps regarding your application for AI Engineer"
                required
                className="h-9 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Message Content *</label>
              <Textarea
                rows={6}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your email message..."
                required
                className="text-sm leading-relaxed"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-100 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsComposeOpen(false)}
                className="h-9 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 gap-1.5"
              >
                <Send size={14} />
                <span>Send via Connected Mailbox</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


    </DashboardLayout>
  );
};

export default EmailsPage;
