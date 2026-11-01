"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Sparkles, 
  Save, 
  Check, 
  Mail, 
  Calendar as CalendarIcon, 
  Video, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  ExternalLink,
  Trash2,
  Lock,
  ArrowRight,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccess, showError } from '@/utils/toast';
import { 
  getConnectedAccount, 
  saveConnectedAccount, 
  disconnectEmailAccount, 
  disconnectCalendarAccount,
  isEmailConnected,
  isCalendarConnected,
  isVideoMeetingConnected,
  disconnectVideoMeetingAccount,
  connectVideoMeetingAccount,
  disconnectAccount,
  ConnectedRecruiterAccount 
} from '@/lib/connectedAccountService';
import { clearAllProfileData } from '@/lib/api';
import { apiFetch } from '@/lib/authHeader';
import { ConnectWorkAccountModal } from '@/components/account/ConnectWorkAccountModal';

const Organization = () => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [connectedAcc, setConnectedAcc] = useState<ConnectedRecruiterAccount | null>(() => getConnectedAccount(user?.id));
  const [serverIntegrations, setServerIntegrations] = useState<any[]>([]);
  
  // Modal states for Email, Calendar & Video Meetings
  const [modalCategory, setModalCategory] = useState<'email' | 'calendar' | 'meeting' | 'all'>('email');
  const [modalProviderId, setModalProviderId] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadIntegrations = async () => {
    try {
      const res = await apiFetch('/api/integrations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.integrations)) {
          setServerIntegrations(data.integrations);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadIntegrations();
  }, [user?.id]);

  useEffect(() => {
    const acc = getConnectedAccount(user?.id);
    if (user?.userType === 'trial' && acc?.email?.toLowerCase().includes('angellagarland')) {
      disconnectAccount(user?.id);
      setConnectedAcc(null);
    } else {
      setConnectedAcc(acc);
    }
  }, [user?.id, user?.userType]);

  useEffect(() => {
    const handleUpdate = () => {
      loadIntegrations();
      const acc = getConnectedAccount(user?.id);
      if (user?.userType === 'trial' && acc?.email?.toLowerCase().includes('angellagarland')) {
        disconnectAccount(user?.id);
        setConnectedAcc(null);
      } else {
        setConnectedAcc(acc);
      }
    };
    window.addEventListener('unified_account_updated', handleUpdate);

    return () => {
      window.removeEventListener('unified_account_updated', handleUpdate);
    };
  }, [user?.id, user?.userType]);

  const [profile, setProfile] = useState({
    companyName: user?.companyName || 'HireFlow Demo',
    industry: 'Technology & AI Automation',
    location: 'Remote / Global',
    hiringEmail: user?.email || 'recruiting@hireforce.ai',
  });

  const [isResetting, setIsResetting] = useState(false);

  const handleResetAllDemoData = async () => {
    if (!window.confirm("Are you sure you want to completely clear all data? This will delete all jobs, candidates, resumes, and interview schedules, and disconnect all email & calendar connections so you can test as a brand new profile.")) {
      return;
    }

    setIsResetting(true);
    try {
      await clearAllProfileData();
      showSuccess("All demo data, jobs, candidates, interviews, and connections have been completely cleared!");
      setTimeout(() => {
        window.location.href = '/jobs';
      }, 1000);
    } catch (err: any) {
      showError("Failed to clear data: " + (err?.message || "Unknown error"));
      setIsResetting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    showSuccess('Organization settings saved successfully!');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleOpenConnect = (cat: 'email' | 'calendar' | 'meeting' | 'all', providerId?: string) => {
    setModalProviderId(providerId);
    setModalCategory(cat);
    setIsModalOpen(true);
  };

  const handleToggleMeetingFormat = (format: 'teams' | 'google_meet') => {
    const existing = getConnectedAccount(user?.id);
    if (existing) {
      const updated: ConnectedRecruiterAccount = {
        ...existing,
        calendar_sync: {
          ...existing.calendar_sync,
          default_format: format,
          calendar_name: format === 'teams' ? 'Microsoft Teams' : 'Google Calendar (Primary)',
        }
      };
      saveConnectedAccount(updated, user?.id);
      setConnectedAcc(updated);
      connectVideoMeetingAccount(format, user?.id);
      showSuccess(`Default interview room format switched to ${format === 'teams' ? 'Microsoft Teams' : 'Google Meet'}!`);
    } else {
      handleOpenConnect('meeting');
    }
  };

  const handleDisconnectEmail = async () => {
    if (window.confirm('Disconnect your email mailbox? Candidate email thread syncing will be paused.')) {
      try {
        await apiFetch('/api/integrations?service=mail', { method: 'DELETE' });
      } catch {}
      disconnectEmailAccount(user?.id);
      await loadIntegrations();
      showSuccess('Email mailbox disconnected.');
    }
  };

  const handleDisconnectCalendar = async () => {
    if (window.confirm('Disconnect your calendar integration? Video room generation and availability sync will be paused.')) {
      try {
        await apiFetch('/api/integrations?service=calendar', { method: 'DELETE' });
      } catch {}
      disconnectCalendarAccount(user?.id);
      await loadIntegrations();
      showSuccess('Calendar integration disconnected.');
    }
  };

  const handleDisconnectMeeting = async () => {
    if (window.confirm('Disconnect your video meeting integration? Meeting room generation will be paused.')) {
      try {
        await apiFetch('/api/integrations?service=meeting', { method: 'DELETE' });
      } catch {}
      disconnectVideoMeetingAccount(user?.id);
      await loadIntegrations();
      setConnectedAcc(getConnectedAccount(user?.id));
      showSuccess('Video meeting integration disconnected.');
    }
  };

  const emailActive = serverIntegrations.some(i => i.service === 'mail') || isEmailConnected(user?.id);
  const calendarActive = serverIntegrations.some(i => i.service === 'calendar') || isCalendarConnected(user?.id);
  const videoActive = serverIntegrations.some(i => i.service === 'meeting' || i.service === 'calendar') || isVideoMeetingConnected(user?.id);

  const displayAccount = connectedAcc || (serverIntegrations.length > 0 ? {
    id: 'server-int',
    email: serverIntegrations[0].account_email,
    recruiter_name: (serverIntegrations[0].account_email || 'Recruiter').split('@')[0],
    provider: serverIntegrations[0].provider,
    calendar_sync: {
      calendar_name: `${serverIntegrations[0].provider === 'google' ? 'Google Calendar (Primary)' : 'Primary Calendar'}`,
      default_format: serverIntegrations[0].provider === 'microsoft' ? 'teams' : 'google_meet',
    }
  } : null);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Workspace Settings</h1>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              Active Organization
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Configure your recruiter email mailbox, calendar sync, video interview rooms, and corporate profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            size="sm"
            className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm gap-1.5"
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            <span>{saved ? 'Saved' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* THREE DEDICATED INTEGRATION BOXES: EMAIL, CALENDAR & VIDEO MEETINGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
        
        {/* BOX 1: RECRUITER EMAIL MAILBOX */}
        <Card className="bg-white border border-zinc-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b border-zinc-100 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <Mail size={18} />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                    Email Mailbox Integration
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Send candidate interview invites & sync inbox threads
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={emailActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" : "bg-zinc-100 text-zinc-500 border-zinc-200 text-[10px]"}
              >
                {emailActive ? "Active & Synced" : "Not Connected"}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {emailActive && displayAccount ? (
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Connected Address:</span>
                      <span className="font-bold text-zinc-900">{displayAccount.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Provider:</span>
                      <span className="font-medium text-zinc-800 capitalize">{displayAccount.provider === 'google' ? 'Google Workspace / Gmail' : displayAccount.provider === 'microsoft' ? 'Microsoft Outlook 365' : displayAccount.provider}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Recruiter Profile:</span>
                      <span className="text-zinc-700">{displayAccount.recruiter_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50/70 p-2.5 rounded border border-emerald-200/70">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                    <span>Direct 1-tap OAuth active. Candidate email threads sync automatically.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-zinc-600">
                  <p className="leading-relaxed">
                    Connect your professional email to dispatch candidate correspondence directly from your own domain with <strong>zero app passwords</strong>.
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 text-center">
                      <div className="font-bold text-red-600 text-xs">Gmail</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Google Workspace</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 text-center">
                      <div className="font-bold text-blue-600 text-xs">Outlook</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Office 365</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 text-center">
                      <div className="font-bold text-amber-600 text-xs">Zoho</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Zoho Mail</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-5 pt-0 border-t border-zinc-100 mt-2">
            {emailActive ? (
              <div className="flex items-center justify-between pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenConnect('email')}
                  className="h-8 text-xs font-semibold border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:!text-zinc-900"
                >
                  Change Email Account
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectEmail}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                >
                  <Trash2 size={13} />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => handleOpenConnect('email')}
                className="w-full h-8.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs gap-1.5 mt-3"
              >
                <Mail size={14} />
                Connect Recruiter Email Mailbox
                <ArrowRight size={13} />
              </Button>
            )}
          </div>
        </Card>

        {/* BOX 2: RECRUITER CALENDAR & VIDEO ROOMS */}
        <Card className="bg-white border border-zinc-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b border-zinc-100 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                    Recruiter Calendar
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Auto-generate Google Meet & Teams interview rooms
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={calendarActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" : "bg-zinc-100 text-zinc-500 border-zinc-200 text-[10px]"}
              >
                {calendarActive ? "Calendar Connected" : "Not Connected"}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {calendarActive && displayAccount ? (
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Primary Calendar:</span>
                      <span className="font-bold text-zinc-900">{displayAccount.calendar_sync?.calendar_name || 'Primary Recruiter Calendar'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Default Room Format:</span>
                      <span className="font-medium text-emerald-700 capitalize font-mono text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {displayAccount.calendar_sync?.default_format === 'teams' ? 'Microsoft Teams' : 'Google Meet HD'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Calendar Free/Busy:</span>
                      <span className="text-emerald-700 font-medium">Automatic Conflict Check Active</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50/70 p-2.5 rounded border border-emerald-200/70">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                    <span>Real-time availability syncing active. No overlapping candidate slots.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-zinc-600">
                  <p className="leading-relaxed">
                    Connect your work calendar to check real-time availability and automatically inject secure video conference rooms into candidate invites.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 text-center">
                      <div className="font-bold text-emerald-600 text-xs">Google Meet</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Google Workspace</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 text-center">
                      <div className="font-bold text-indigo-600 text-xs">Microsoft Teams</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Microsoft 365</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-5 pt-0 border-t border-zinc-100 mt-2">
            {calendarActive ? (
              <div className="flex items-center justify-between pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenConnect('calendar')}
                  className="h-8 text-xs font-semibold border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:!text-zinc-900"
                >
                  Change Calendar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectCalendar}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                >
                  <Trash2 size={13} />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => handleOpenConnect('calendar')}
                className="w-full h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs gap-1.5 mt-3"
              >
                <CalendarIcon size={14} />
                Connect Recruiter Calendar
                <ArrowRight size={13} />
              </Button>
            )}
          </div>
        </Card>

        {/* BOX 3: VIDEO MEETINGS & INTERVIEW ROOMS (MICROSOFT TEAMS & GOOGLE MEET) */}
        <Card className="bg-white border border-zinc-200/90 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 pb-3 border-b border-zinc-100 flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                  displayAccount?.calendar_sync?.default_format === 'teams'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                }`}>
                  <Video size={18} />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                    Video Meeting Integration
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Microsoft Teams & Google Meet interview rooms
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={
                  videoActive
                    ? (displayAccount?.calendar_sync?.default_format === 'teams'
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]")
                    : "bg-zinc-100 text-zinc-500 border-zinc-200 text-[10px]"
                }
              >
                {videoActive
                  ? (displayAccount?.calendar_sync?.default_format === 'teams' ? "Teams Active" : "Meet Active")
                  : "Not Connected"}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {videoActive ? (
                <div className="space-y-3">
                  {/* Format selection pills */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-zinc-500">Default Meeting Room Provider:</label>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        {displayAccount?.calendar_sync?.default_format === 'teams' ? 'Microsoft Teams' : 'Google Meet'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleMeetingFormat('google_meet')}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          connectedAcc?.calendar_sync?.default_format !== 'teams'
                            ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-600/20'
                            : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-emerald-600">Google Meet</span>
                          {connectedAcc?.calendar_sync?.default_format !== 'teams' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-tight">Direct HD Rooms (Active)</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleMeetingFormat('teams')}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          connectedAcc?.calendar_sync?.default_format === 'teams'
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-1 ring-indigo-600/20'
                            : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-indigo-600">Microsoft Teams</span>
                          {connectedAcc?.calendar_sync?.default_format === 'teams' && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-tight">Nango Integrated</p>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Active Room Format:</span>
                      <span className="font-bold text-zinc-900">
                        {connectedAcc?.calendar_sync?.default_format === 'teams' ? 'Microsoft Teams' : 'Google Meet'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Provider:</span>
                      <span className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                        connectedAcc?.calendar_sync?.default_format === 'teams'
                          ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}>
                        {connectedAcc?.calendar_sync?.default_format === 'teams' ? 'microsoft-teams' : 'google-meet'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Auto-Generate Links:</span>
                      <span className="text-emerald-700 font-medium">Enabled (Direct URL)</span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 text-[11px] p-2.5 rounded border ${
                    connectedAcc?.calendar_sync?.default_format === 'teams'
                      ? 'text-indigo-700 bg-indigo-50/70 border-indigo-200/70'
                      : 'text-emerald-700 bg-emerald-50/70 border-emerald-200/70'
                  }`}>
                    <ShieldCheck size={14} className={`shrink-0 ${
                      connectedAcc?.calendar_sync?.default_format === 'teams' ? 'text-indigo-600' : 'text-emerald-600'
                    }`} />
                    <span>Interview invites automatically include your chosen video room link.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-zinc-600">
                  <p className="leading-relaxed">
                    Connect your preferred video conferencing provider to automatically generate live interview room links (Google Meet or Microsoft Teams) when scheduling candidates.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 text-left">
                      <div className="font-bold text-emerald-700 text-xs flex items-center gap-1.5">
                        <Video size={13} />
                        Google Meet
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">Direct HD video rooms via Google Calendar</div>
                    </div>
                    <div className="p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 text-left">
                      <div className="font-bold text-indigo-700 text-xs flex items-center gap-1.5">
                        <Video size={13} />
                        Microsoft Teams
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">Enterprise team rooms with Office 365</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-5 pt-0 border-t border-zinc-100 mt-2">
            {videoActive ? (
              <div className="flex items-center justify-between pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenConnect('meeting')}
                  className="h-8 text-xs font-semibold border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:!text-zinc-900"
                >
                  Change Meeting Provider
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnectMeeting}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => handleOpenConnect('meeting')}
                className="w-full h-8.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs gap-1.5 mt-3 cursor-pointer"
              >
                <Video size={14} />
                Connect Video Meeting Rooms
                <ArrowRight size={13} />
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* CLOUD-READY PROFILE (AI SCREENING CONFIGURATION REMOVED AS REQUESTED) */}
      <div className="grid grid-cols-1 gap-5">
        
        {/* Organization Profile */}
        <Card className="bg-white border border-zinc-200/90 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-zinc-100">
            <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Building2 size={16} className="text-zinc-600" />
              Organization Profile
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Branding and corporate metadata displayed on candidate portals.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Company Name</Label>
                <Input 
                  value={profile.companyName}
                  onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                  className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Industry / Domain</Label>
                <Input 
                  value={profile.industry}
                  onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                  className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Recruiting Contact Email</Label>
                <Input 
                  value={profile.hiringEmail}
                  onChange={(e) => setProfile({ ...profile, hiringEmail: e.target.value })}
                  className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Headquarters / Location</Label>
                <Input 
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                  <Globe size={13} className="text-emerald-600" />
                  Primary Operating Timezone
                </Label>
                <div className="h-9 px-3 rounded-md bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs text-zinc-800 font-mono font-medium max-w-xl">
                  <span>{Intl.DateTimeFormat().resolvedOptions().timeZone} ({new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'Local'})</span>
                  <span className="text-[10px] text-emerald-700 font-sans font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    System Detected
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 block">Candidate interview sessions and calendar invites automatically align with your local system timezone.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clean Profile & Demo Reset Card */}
        <Card className="border border-red-200 bg-red-50/20 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-red-100 bg-red-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 size={16} className="text-red-600" />
                <CardTitle className="text-sm font-bold text-red-950">Clean Profile & Data Reset</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] bg-white text-red-700 border-red-300">
                Testing Utility
              </Badge>
            </div>
            <CardDescription className="text-xs text-red-800/80 mt-1">
              Clear all demo jobs, candidates, resumes, interview schedules, and connected accounts to test HireForce as a brand new profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex items-center justify-between flex-wrap gap-4">
            <div className="text-xs text-zinc-600 max-w-lg">
              Clicking this button wipes all local and Supabase data (jobs, candidates, interview events) and removes any email/calendar connections, leaving your workspace completely clean.
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isResetting}
              onClick={handleResetAllDemoData}
              className="text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer bg-red-600 hover:bg-red-700 text-white"
            >
              {isResetting ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Clearing All Data...</span>
                </>
              ) : (
                <>
                  <Trash2 size={13} />
                  <span>Clear All Data (Start Fresh)</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Connect Modal */}
      <ConnectWorkAccountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={modalCategory}
        initialProviderId={modalProviderId}
        onSuccess={() => {
          setConnectedAcc(getConnectedAccount());
        }}
      />
    </DashboardLayout>
  );
};

export default Organization;
