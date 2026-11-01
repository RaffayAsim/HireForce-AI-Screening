import { triggerAutomation, checkAndDispatchInterviewReminders } from '@/lib/automationService';
import { getAuthHeaders, apiFetch } from '@/lib/authHeader';
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Calendar as CalendarIcon,
  Clock,
  Video,
  Phone,
  User,
  Briefcase,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MapPin,
  CalendarCheck,
  Check,
  Sparkles,
  Globe,
  Copy,
  Trash2
} from 'lucide-react';
import {
  getInterviews,
  saveInterview,
  saveInterviewAsync,
  updateInterviewStatus,
  deleteInterview,
  Interview
} from '@/lib/calendarService';
import { subscribeToCandidates, subscribeToJobs, Candidate, Job } from '@/lib/api';
import { showSuccess, showError } from '@/utils/toast';
import { getConnectedAccount, isCalendarConnected, disconnectAccount, ConnectedRecruiterAccount } from '@/lib/connectedAccountService';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Download, CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

type MeetingFormat = 'google_meet' | 'teams' | 'zoho_meeting' | 'zoom' | 'phone' | 'in_person';

const InterviewCalendar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [connectedAcc, setConnectedAcc] = useState<ConnectedRecruiterAccount | null>(() => getConnectedAccount(user?.id));
  const [isWorkAccountModalOpen, setIsWorkAccountModalOpen] = useState(false);
  const [serverIntegrations, setServerIntegrations] = useState<any[]>([]);

  const loadServerIntegrations = async () => {
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
    loadServerIntegrations();
    window.addEventListener('unified_account_updated', loadServerIntegrations);
    return () => window.removeEventListener('unified_account_updated', loadServerIntegrations);
  }, [user?.id]);

  const hasGoogle = serverIntegrations.some(i => i.provider === 'google' && (i.service === 'meeting' || i.service === 'calendar')) || (connectedAcc?.status === 'active' && connectedAcc?.provider === 'google');
  const hasMicrosoft = serverIntegrations.some(i => i.provider === 'microsoft' && (i.service === 'meeting' || i.service === 'calendar')) || (connectedAcc?.status === 'active' && connectedAcc?.provider === 'microsoft');
  const hasZoho = serverIntegrations.some(i => i.provider === 'zoho' && i.service === 'meeting') || (connectedAcc?.status === 'active' && (connectedAcc?.provider as any) === 'zoho');

  useEffect(() => {
    setConnectedAcc(getConnectedAccount(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const handleAccUpdate = () => {
      const acc = getConnectedAccount(user?.id);
      setConnectedAcc(acc);
      if (acc && acc.status === 'active') {
        setInterviewer(acc.recruiter_name);
      }
      if (hasGoogle) {
        setMeetingFormat('google_meet');
      } else if (hasMicrosoft) {
        setMeetingFormat('teams');
      } else if (hasZoho) {
        setMeetingFormat('zoho_meeting');
      } else {
        setMeetingFormat('phone');
      }
      loadInterviews();
    };
    handleAccUpdate();
    window.addEventListener('unified_account_updated', handleAccUpdate);

    return () => window.removeEventListener('unified_account_updated', handleAccUpdate);
  }, [user?.id, hasGoogle, hasMicrosoft, hasZoho]);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const calendarConnected = isCalendarConnected() || serverIntegrations.some(i => i.service === 'calendar');

  // New Interview Form
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [roundType, setRoundType] = useState<Interview['round_type']>('Technical Round');
  const [meetingFormat, setMeetingFormat] = useState<MeetingFormat>('phone');
  const [interviewDate, setInterviewDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [interviewTime, setInterviewTime] = useState('10:00');
  const [duration, setDuration] = useState('45');
  const [interviewer, setInterviewer] = useState('Talent Acquisition Team');
  const [meetingLink, setMeetingLink] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const handleCancelSession = async () => {
    if (!selectedInterview) return;
    setIsProcessingAction(true);
    try {
      const gId = (selectedInterview as any).google_event_id || selectedInterview.id;
      const res = await apiFetch('/api/calendar/events', {
        method: 'PATCH',
        body: JSON.stringify({ id: selectedInterview.id, google_event_id: gId, status: 'Cancelled' }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        showError(errJson.error || 'Failed to cancel interview');
        setIsProcessingAction(false);
        return;
      }
      updateInterviewStatus(selectedInterview.id, 'Cancelled', user?.id);
      setSelectedInterview(null);
      showSuccess('Interview Cancelled');
      loadInterviews();
    } catch (e: any) {
      showError(e?.message || 'Failed to cancel interview');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedInterview) return;
    if (!window.confirm('Are you sure you want to delete this interview session?')) return;
    setIsProcessingAction(true);
    try {
      const gId = (selectedInterview as any).google_event_id || selectedInterview.id;
      const res = await apiFetch(`/api/calendar/events?id=${encodeURIComponent(selectedInterview.id)}&google_event_id=${encodeURIComponent(gId)}`, {
        method: 'DELETE',
        body: JSON.stringify({ id: selectedInterview.id, google_event_id: gId }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        showError(errJson.error || 'Failed to delete interview');
        setIsProcessingAction(false);
        return;
      }
      deleteInterview(selectedInterview.id, user?.id, selectedInterview.candidate_id, selectedInterview.date, selectedInterview.time);
      setSelectedInterview(null);
      showSuccess('Interview deleted successfully');
      loadInterviews();
    } catch (e: any) {
      showError(e?.message || 'Failed to delete interview');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const loadInterviews = async () => {
    // Delete legacy unscoped key on load (FIX 1)
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('hireforce_local_interviews'); } catch { }
    }

    if (!user?.id) {
      setInterviews([]);
      return;
    }

    // 1. Immediately display user-scoped local interviews (never read without user.id)
    const localInterviews = getInterviews(user.id);
    setInterviews(localInterviews);

    // 2. Fetch from backend / Google Calendar strictly for user.id
    try {
      const res = await fetch(`/api/calendar/events?userId=${encodeURIComponent(user.id)}`, {
        headers: getAuthHeaders(user.id)
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        if (data.events.length === 0) {
          setInterviews(localInterviews);
          return;
        }

        const combined = [...localInterviews];
        data.events.forEach((remote: any) => {
          const index = combined.findIndex(c =>
            c.id === remote.id ||
            (c as any).google_event_id === remote.id ||
            (c.candidate_id && remote.candidate_id && c.candidate_id === remote.candidate_id && c.date?.split('T')[0] === remote.date?.split('T')[0] && c.time === remote.time) ||
            (c.candidate_email && remote.candidate_email && c.candidate_email.toLowerCase() === remote.candidate_email.toLowerCase() && c.date?.split('T')[0] === remote.date?.split('T')[0]) ||
            (c.meeting_link && remote.meeting_link && c.meeting_link === remote.meeting_link)
          );

          if (index >= 0) {
            combined[index] = {
              ...remote,
              ...combined[index],
              id: remote.id || combined[index].id,
              google_event_id: remote.id || (combined[index] as any).google_event_id,
              user_id: user.id,
              meeting_format: remote.meeting_format || combined[index].meeting_format || (remote.meeting_link?.includes('teams') ? 'teams' : 'google_meet'),
              meeting_link: remote.meeting_link || combined[index].meeting_link,
              phone_number: combined[index].phone_number || remote.phone_number,
            };
          } else {
            combined.push({
              ...remote,
              google_event_id: remote.id,
              user_id: user.id,
              duration_minutes: remote.duration_minutes || remote.duration || 45,
              round_type: remote.round_type || 'Technical Round',
              status: remote.status === 'scheduled' ? 'Scheduled' : (remote.status || 'Scheduled'),
              interviewer: remote.interviewer || remote.host_recruiter || 'Talent Acquisition Team',
              meeting_format: remote.meeting_format || remote.format || (remote.meeting_link?.includes('teams') ? 'teams' : 'google_meet'),
            });
          }
        });

        // Deduplicate entire list strictly by ID or (candidate_id + date + time)
        const seen = new Set<string>();
        const deduplicated: any[] = [];
        for (const item of combined) {
          const key1 = item.id;
          const key2 = item.candidate_id && item.date ? `${item.candidate_id}_${item.date}_${item.time || ''}` : null;
          if (seen.has(key1) || (key2 && seen.has(key2))) {
            continue;
          }
          seen.add(key1);
          if (key2) seen.add(key2);
          deduplicated.push(item);
        }

        // Filter strictly by user_id
        const userScopedCombined = deduplicated.filter(int => !int.user_id || int.user_id === user.id);
        setInterviews(userScopedCombined);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`hireforce_local_interviews_${user.id}`, JSON.stringify(userScopedCombined));
            localStorage.removeItem('hireforce_local_interviews');
          } catch { }
        }
        return;
      }
    } catch (e) {
      console.warn("Failed to fetch Google Calendar events:", e);
    }
    setInterviews(localInterviews);
  };

  useEffect(() => {
    loadInterviews();
    window.addEventListener('local_interviews_updated', loadInterviews);

    const unsubCandidates = subscribeToCandidates((data) => setCandidates(data), user?.id);
    const unsubJobs = subscribeToJobs((data) => setJobs(data), user?.id);

    return () => {
      window.removeEventListener('local_interviews_updated', loadInterviews);
      unsubCandidates();
      unsubJobs();
    };
  }, [user?.id]);

  // When meeting format changes, generate appropriate link
  const handleMeetingFormatChange = (format: MeetingFormat) => {
    setMeetingFormat(format);
    if (format === 'google_meet') {
      setMeetingLink('');
    } else if (format === 'teams') {
      setMeetingLink('');
    } else if (format === 'zoom') {
      setMeetingLink(`https://zoom.us/j/987${Math.floor(1000000 + Math.random() * 9000000)}`);
    } else if (format === 'phone') {
      setMeetingLink('');
      if (selectedCandidate?.phone) {
        setPhoneNumber(selectedCandidate.phone);
      }
    }
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const selectedCandidate = useMemo(() => {
    return candidates.find(c => c.id === selectedCandidateId) || null;
  }, [candidates, selectedCandidateId]);

  // When candidate is selected, auto-fill phone if phone format is active
  useEffect(() => {
    if (selectedCandidate && selectedCandidate.phone) {
      setPhoneNumber(selectedCandidate.phone);
    }
  }, [selectedCandidate]);

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) {
      showError('Please select a candidate');
      return;
    }

    const jobTitle = jobs.find(j => j.id === selectedCandidate.job_id)?.title || 'General Position';

    let finalLink = meetingLink;
    if (meetingFormat === 'phone') {
      finalLink = `tel:${phoneNumber || selectedCandidate.phone || ''}`;
    }

    try {
      const created = await saveInterviewAsync({
        user_id: user?.id,
        candidate_id: selectedCandidate.id,
        candidate_name: selectedCandidate.full_name,
        candidate_email: selectedCandidate.email,
        job_id: selectedCandidate.job_id,
        job_title: jobTitle,
        round_type: roundType,
        meeting_format: meetingFormat,
        meeting_link: finalLink,
        phone_number: phoneNumber || selectedCandidate.phone || undefined,
        location: locationAddress || undefined,
        date: interviewDate,
        time: interviewTime,
        duration_minutes: parseInt(duration) || 45,
        interviewer: interviewer.trim() || 'Hiring Team',
        notes: notes.trim(),
        status: 'Scheduled',
      }, user?.id);

      setInterviews(prev => [created, ...prev.filter(i => i.id !== created.id)]);

      // Recruitment Automation: Interview Invitation & Meeting Link Details
      try {
        const meetingDetails = meetingFormat === 'in_person' || (meetingFormat as string) === 'physical'
          ? (locationAddress || 'Company Office')
          : (meetingFormat === 'phone' ? (phoneNumber || selectedCandidate.phone || 'Phone Call') : (created.meeting_link || finalLink));

        triggerAutomation('interview_scheduled', {
          candidate_id: selectedCandidate.id,
          candidate_name: selectedCandidate.full_name,
          candidate_email: selectedCandidate.email,
          job_title: jobTitle,
          company_name: user?.companyName || 'HireForce',
          round_type: roundType,
          meeting_format: meetingFormat === 'google_meet' ? 'Google Meet' : (meetingFormat === 'teams' ? 'Microsoft Teams' : (meetingFormat === 'phone' ? 'Phone Interview' : 'Physical On-site')),
          meeting_link_or_address: meetingDetails,
          interview_date_time: `${interviewDate} at ${interviewTime}`,
          user_id: user?.id,
          recruiter_id: user?.id,
          recruiter_name: user?.fullName || user?.companyName || 'Hiring Team',
        });
      } catch (err) {
        console.warn('Failed to trigger interview_scheduled automation:', err);
      }
      showSuccess(`Interview scheduled with ${selectedCandidate.full_name}! Added to your calendar.`);
      setIsScheduleOpen(false);
      setSelectedCandidateId('');
    } catch (schedErr: any) {
      console.error('Interview schedule error:', schedErr);
      showError(schedErr.message || 'Failed to schedule interview');
    }
  };

  // Group interviews by date string YYYY-MM-DD (filtered by user_id)
  const interviewsByDate = useMemo(() => {
    const map: Record<string, Interview[]> = {};
    const filtered = user?.id ? interviews.filter(i => !i.user_id || i.user_id === user.id) : [];
    filtered.forEach(int => {
      const cleanDate = int.date ? int.date.split('T')[0].trim() : '';
      if (!cleanDate) return;
      if (!map[cleanDate]) map[cleanDate] = [];
      map[cleanDate].push({
        ...int,
        date: cleanDate,
      });
    });
    return map;
  }, [interviews, user?.id]);

  const upcomingInterviews = useMemo(() => {
    const filtered = user?.id ? interviews.filter(i => !i.user_id || i.user_id === user.id) : [];
    return [...filtered].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [interviews, user?.id]);

  const getFormatLabel = (fmt?: MeetingFormat) => {
    switch (fmt) {
      case 'teams': return 'Microsoft Teams';
      case 'zoom': return 'Zoom Meeting';
      case 'phone': return 'Phone Call';
      case 'in_person': return 'In-Person / Onsite';
      default: return 'Google Meet';
    }
  };

  const getFormatIcon = (fmt?: MeetingFormat) => {
    switch (fmt) {
      case 'phone': return <Phone size={13} className="text-blue-600" />;
      case 'in_person': return <MapPin size={13} className="text-amber-600" />;
      default: return <Video size={13} className="text-emerald-600" />;
    }
  };

  // Non-blocking: Local interview calendar is always active!

  return (
    <DashboardLayout>
      {!calendarConnected && (
        <div className="mb-5 p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-900 font-medium">
            <Sparkles size={16} className="text-emerald-600 shrink-0" />
            <span><strong>Interview Calendar Ready:</strong> All scheduled candidate screening sessions and interview meetings appear here. Connect Google Calendar or Microsoft Teams in Settings for cloud sync.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/settings')}
            className="h-7 text-xs font-semibold bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100 shrink-0 gap-1"
          >
            <CalendarCheck size={13} />
            Connect Cloud Calendar
          </Button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Interview Calendar</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Schedule candidate screening calls, coordinate Google Meet, Microsoft Teams, or Phone interviews.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center rounded-md border border-zinc-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                "px-3 py-1 rounded text-xs font-semibold transition-all",
                viewMode === 'month' ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={cn(
                "px-3 py-1 rounded text-xs font-semibold transition-all",
                viewMode === 'agenda' ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              Agenda List
            </button>
          </div>



          <Button
            onClick={() => setIsScheduleOpen(true)}
            className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-2xs gap-1.5"
          >
            <Plus size={15} />
            <span>Schedule Interview</span>
          </Button>
        </div>
      </div>

      {/* Month Navigation Toolbar */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-4 mb-5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-900">
            {monthNames[month]} {year}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-7 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium px-2.5"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="h-8 w-8 p-0 rounded-md border-zinc-200 text-zinc-600"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0 rounded-md border-zinc-200 text-zinc-600"
            title="Next month"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'month' && (
        <div className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-2xs">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-semibold text-zinc-500 py-2.5 uppercase tracking-wider">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-zinc-200">
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[110px] bg-zinc-50/40 p-2" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayInterviews = interviewsByDate[dateString] || [];
              const isToday = new Date().toISOString().split('T')[0] === dateString;

              return (
                <div
                  key={`day-${dayNum}`}
                  className={cn(
                    "min-h-[110px] p-2 transition-colors relative flex flex-col justify-between hover:bg-zinc-50/80",
                    isToday && "bg-emerald-50/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn(
                      "text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full",
                      isToday ? "bg-emerald-600 text-white font-bold" : "text-zinc-700"
                    )}>
                      {dayNum}
                    </span>
                    {dayInterviews.length > 0 && (
                      <span className="text-[10px] font-bold text-zinc-400">
                        {dayInterviews.length} {dayInterviews.length === 1 ? 'call' : 'calls'}
                      </span>
                    )}
                  </div>

                  {/* Interview Tags in cell */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {dayInterviews.map((int) => (
                      <button
                        key={int.id}
                        onClick={() => setSelectedInterview(int)}
                        className={cn(
                          "w-full text-left px-2 py-1 rounded text-[11px] font-semibold border truncate transition-all flex items-center justify-between gap-1",
                          int.status === 'Completed'
                            ? "bg-zinc-100 text-zinc-600 border-zinc-200"
                            : int.status === 'Cancelled'
                              ? "bg-red-50 text-red-600 border-red-200 opacity-60 line-through"
                              : int.meeting_format === 'phone'
                                ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/70"
                                : int.meeting_format === 'teams'
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100/70"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70"
                        )}
                      >
                        <span className="truncate">
                          <span className="font-mono text-[10px] mr-1">{int.time}</span>
                          {int.candidate_name}
                        </span>
                        {getFormatIcon(int.meeting_format)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda List View */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-zinc-200/90 rounded-xl overflow-hidden shadow-2xs divide-y divide-zinc-100">
          {upcomingInterviews.map((int) => (
            <div
              key={int.id}
              onClick={() => setSelectedInterview(int)}
              className="p-4 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={cn(
                  "w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0",
                  int.meeting_format === 'phone' ? "bg-blue-50 border-blue-200 text-blue-600" :
                    int.meeting_format === 'teams' ? "bg-indigo-50 border-indigo-200 text-indigo-600" :
                      "bg-emerald-50 border-emerald-200 text-emerald-600"
                )}>
                  {int.meeting_format === 'phone' ? <Phone size={18} /> : <Video size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-900">{int.candidate_name}</h3>
                    <Badge variant="outline" className="text-[10px] font-semibold border-zinc-200">
                      {int.round_type}
                    </Badge>
                    <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                      {getFormatLabel(int.meeting_format)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {int.job_title} &bull; Hosted by {int.interviewer}
                    {int.phone_number && ` • ${int.phone_number}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-600 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock size={13} className="text-zinc-400" />
                  <span>{int.date} at {int.time} ({int.duration_minutes}m)</span>
                </div>
                {int.meeting_format === 'phone' ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${int.phone_number || ''}`, '_self');
                    }}
                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium gap-1"
                  >
                    <Phone size={13} />
                    <span>Call Phone</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (int.meeting_link) window.open(int.meeting_link, '_blank');
                    }}
                    className="h-8 text-xs bg-zinc-900 hover:bg-emerald-600 text-white font-medium gap-1"
                  >
                    <Video size={13} />
                    <span>Join {int.meeting_format === 'teams' ? 'Teams' : 'Meet'}</span>
                  </Button>
                )}
              </div>
            </div>
          ))}

          {upcomingInterviews.length === 0 && (
            <div className="p-12 text-center text-sm text-zinc-400">
              <CalendarIcon size={32} className="mx-auto mb-2 text-zinc-300" />
              <p className="font-semibold text-zinc-700">No interviews scheduled</p>
              <p className="text-xs text-zinc-400 mt-1">Click "+ Schedule Interview" to book your next candidate round.</p>
            </div>
          )}
        </div>
      )}

      {/* Schedule Interview Modal */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-lg bg-white p-6 rounded-xl border border-zinc-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-zinc-900">Schedule Candidate Interview</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              Choose meeting format (Google Meet, Microsoft Teams, Phone Call), select evaluation rounds, and book time.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInterview} className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Select Candidate *</label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="">Choose an applicant from your pipeline...</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email}) {c.phone ? `• ${c.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Meeting Format Selector */}
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1.5">Meeting Option / Format *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {hasGoogle && (
                  <button
                    type="button"
                    onClick={() => handleMeetingFormatChange('google_meet')}
                    className={cn(
                      "p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                      meetingFormat === 'google_meet'
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs ring-1 ring-emerald-500/20"
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <Video size={16} className={meetingFormat === 'google_meet' ? 'text-emerald-600' : 'text-zinc-500'} />
                    <span>Google Meet</span>
                  </button>
                )}

                {hasMicrosoft && (
                  <button
                    type="button"
                    onClick={() => handleMeetingFormatChange('teams')}
                    className={cn(
                      "p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                      meetingFormat === 'teams'
                        ? "bg-indigo-50 border-indigo-500 text-indigo-800 shadow-2xs ring-1 ring-indigo-500/20"
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <Video size={16} className={meetingFormat === 'teams' ? 'text-indigo-600' : 'text-zinc-500'} />
                    <span>Microsoft Teams</span>
                  </button>
                )}

                {hasZoho && (
                  <button
                    type="button"
                    onClick={() => handleMeetingFormatChange('zoho_meeting')}
                    className={cn(
                      "p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                      meetingFormat === 'zoho_meeting'
                        ? "bg-amber-50 border-amber-500 text-amber-800 shadow-2xs ring-1 ring-amber-500/20"
                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <Video size={16} className={meetingFormat === 'zoho_meeting' ? 'text-amber-600' : 'text-zinc-500'} />
                    <span>Zoho Meeting</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleMeetingFormatChange('phone')}
                  className={cn(
                    "p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                    meetingFormat === 'phone'
                      ? "bg-blue-50 border-blue-500 text-blue-800 shadow-2xs ring-1 ring-blue-500/20"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <Phone size={16} className={meetingFormat === 'phone' ? 'text-blue-600' : 'text-zinc-500'} />
                  <span>Phone Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMeetingFormatChange('in_person')}
                  className={cn(
                    "p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                    meetingFormat === 'in_person'
                      ? "bg-amber-50 border-amber-500 text-amber-800 shadow-2xs ring-1 ring-amber-500/20"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <MapPin size={16} className={meetingFormat === 'in_person' ? 'text-amber-600' : 'text-zinc-500'} />
                  <span>Physical Office</span>
                </button>
              </div>

              {!hasGoogle && !hasMicrosoft && !hasZoho && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mt-2">
                  Connect Google, Microsoft Teams or Zoho in Settings to create a meeting link.
                </p>
              )}
            </div>

            {/* Conditional Format Inputs */}
            {meetingFormat === 'phone' && (
              <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 space-y-1">
                <label className="text-xs font-bold text-blue-900 flex items-center gap-1">
                  <Phone size={13} className="text-blue-600" />
                  Candidate Phone Number to Dial *
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +1 (555) 000-0000"
                  required
                  className="h-8.5 text-xs bg-white border-blue-300 text-zinc-900"
                />
                <span className="text-[11px] text-blue-700 block">Recruiter will dial candidate directly at scheduled time.</span>
              </div>
            )}

            {meetingFormat === 'in_person' && (
              <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 space-y-1">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <MapPin size={13} className="text-amber-600" />
                  Physical Office Location & Room *
                </label>
                <Input
                  type="text"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="e.g. Headquarters, 3rd Floor - Conference Room B"
                  required
                  className="h-8.5 text-xs bg-white border-amber-300 text-zinc-900"
                />
                <span className="text-[11px] text-amber-800 block">Office location and directions will be included in the candidate invitation.</span>
              </div>
            )}

            {(meetingFormat === 'google_meet' || meetingFormat === 'teams') && (
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 text-xs text-zinc-600 flex items-center gap-2">
                <Video size={15} className="text-emerald-600 shrink-0" />
                <span>
                  <strong>Auto-generated meeting room:</strong> A secure {meetingFormat === 'teams' ? 'Microsoft Teams' : 'Google Meet'} room URL will be generated automatically and synced to your calendar. No manual link entry required.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Interview Round</label>
                <select
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm"
                >
                  <option value="Initial Screen">Initial Screen (30m)</option>
                  <option value="Technical Round">Technical Round (45m)</option>
                  <option value="AI Assessment Review">AI Assessment Review (45m)</option>
                  <option value="Hiring Manager">Hiring Manager (60m)</option>
                  <option value="Final Round">Final Round (45m)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Date *</label>
                <Input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Time *</label>
                <Input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Explicit Timezone Indicator */}
            <div className="flex items-center justify-between p-2 rounded-md bg-zinc-50 border border-zinc-200/80 text-[11px]">
              <div className="flex items-center gap-1.5 text-zinc-600 truncate">
                <Globe size={13} className="text-emerald-600 shrink-0" />
                <span className="font-medium">Booking Timezone:</span>
                <span className="font-bold text-zinc-900 font-mono">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone} ({new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || 'Local'})
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 shrink-0">Local Time</span>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Interviewer / Host</label>
              <Input
                value={interviewer}
                onChange={(e) => setInterviewer(e.target.value)}
                placeholder="e.g. Lead Recruiter, Hiring Manager"
                className="h-9 text-sm"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-100 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleOpen(false)}
                className="h-9 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4"
              >
                Confirm Schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Interview Inspection Modal */}
      <Dialog open={!!selectedInterview} onOpenChange={(open) => !open && setSelectedInterview(null)}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-xl border border-zinc-200 shadow-xl">
          {selectedInterview && (
            <div className="space-y-4">
              <DialogHeader className="text-left space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-semibold">
                    {selectedInterview.round_type}
                  </Badge>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded",
                    selectedInterview.status === 'Completed' ? "bg-zinc-100 text-zinc-700" :
                      selectedInterview.status === 'Cancelled' ? "bg-red-50 text-red-700" :
                        "bg-emerald-50 text-emerald-700"
                  )}>
                    {selectedInterview.status}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold text-zinc-900 pt-1">
                  {selectedInterview.candidate_name}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  {selectedInterview.job_title}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2.5 text-sm p-3.5 bg-zinc-50 rounded-lg border border-zinc-100">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5 text-xs">
                    Meeting Format
                  </span>
                  <span className="font-semibold text-zinc-800 flex items-center gap-1">
                    {getFormatIcon(selectedInterview.meeting_format)}
                    {getFormatLabel(selectedInterview.meeting_format)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5 text-xs">
                    <CalendarIcon size={13} /> Date & Time
                  </span>
                  <span className="font-semibold text-zinc-800">
                    {selectedInterview.date} at {selectedInterview.time} ({selectedInterview.duration_minutes}m)
                  </span>
                </div>

                {selectedInterview.phone_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center gap-1.5 text-xs">
                      <Phone size={13} /> Phone
                    </span>
                    <a href={`tel:${selectedInterview.phone_number}`} className="font-semibold text-blue-600 hover:underline">
                      {selectedInterview.phone_number}
                    </a>
                  </div>
                )}

                {/* Explicit Meeting Room Link Bar with 1-Click Copy */}
                {selectedInterview.meeting_link && selectedInterview.meeting_format !== 'phone' && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-zinc-200">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold text-zinc-400 block uppercase tracking-wider">
                        Meeting Link
                      </span>
                      <div className="flex items-center gap-1.5 truncate">
                        <Video size={13} className={selectedInterview.meeting_format === 'teams' ? "text-indigo-600 shrink-0" : "text-emerald-600 shrink-0"} />
                        <span className="text-xs font-mono font-medium text-zinc-800 truncate select-all">
                          {selectedInterview.meeting_link}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInterview.meeting_link || '');
                        showSuccess('Meeting link copied to clipboard!');
                      }}
                      className="h-7 px-2.5 text-xs font-semibold border-zinc-200 text-zinc-700 hover:bg-zinc-100 gap-1 shrink-0 cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>Copy</span>
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5 text-xs">
                    <User size={13} /> Host
                  </span>
                  <span className="font-semibold text-zinc-800">{selectedInterview.interviewer}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {selectedInterview.meeting_format === 'phone' ? (
                  <Button
                    onClick={() => window.open(`tel:${selectedInterview.phone_number || ''}`, '_self')}
                    className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold gap-1.5"
                  >
                    <Phone size={15} />
                    <span>Dial Candidate Phone ({selectedInterview.phone_number || 'No number'})</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (selectedInterview.meeting_link) window.open(selectedInterview.meeting_link, '_blank');
                    }}
                    className={cn(
                      "w-full h-9 text-white text-sm font-semibold gap-1.5",
                      selectedInterview.meeting_format === 'teams' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    <Video size={15} />
                    <span>Launch {selectedInterview.meeting_format === 'teams' ? 'Microsoft Teams' : 'Google Meet'}</span>
                  </Button>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessingAction}
                    onClick={() => {
                      updateInterviewStatus(selectedInterview.id, 'Completed', user?.id);
                      setSelectedInterview(null);
                      showSuccess('Marked as Completed');
                      loadInterviews();
                    }}
                    className="h-8 text-xs font-semibold"
                  >
                    <CheckCircle2 size={13} className="text-emerald-600 mr-1" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessingAction}
                    onClick={handleCancelSession}
                    className="h-8 text-xs font-semibold text-amber-600 hover:bg-amber-50"
                  >
                    <XCircle size={13} className="text-amber-600 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isProcessingAction}
                    onClick={handleDeleteSession}
                    className="h-8 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={13} className="text-red-600 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </DashboardLayout>
  );
};

export default InterviewCalendar;
