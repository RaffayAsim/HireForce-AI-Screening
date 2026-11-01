import { triggerAutomation } from '@/lib/automationService';
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Briefcase, 
  Users, 
  Sparkles, 
  Search, 
  Loader2, 
  LayoutGrid, 
  List, 
  Check, 
  CheckCircle2,
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  ExternalLink, 
  FileText, 
  Mail, 
  Phone, 
  Copy,
  PlusCircle,
  Filter,
  Calendar as CalendarIcon,
  Video,
  MapPin,
  Globe,
  RefreshCw
} from 'lucide-react';
import { 
  subscribeToJobs, 
  subscribeToCandidates, 
  updateCandidateStatus,
  screenCandidateWithAI,
  Candidate, 
  Job 
} from '@/lib/api';
import { CsvExport } from '@/components/talent-pool/CsvExport';
import { DeleteJobData } from '@/components/talent-pool/DeleteJobData';
import { saveLocalCandidate } from '@/lib/localDatabase';
import { saveInterview, saveInterviewAsync, getInterviews, Interview } from '@/lib/calendarService';
import { getConnectedAccount, ConnectedRecruiterAccount } from '@/lib/connectedAccountService';
import { useAuth } from '@/contexts/AuthContext';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

type CandidateStatus = 'new' | 'good' | 'waiting' | 'rejected' | 'hired';

const normalizeStatus = (status?: string): CandidateStatus => {
  if (!status) return 'new';
  const s = status.toLowerCase().trim();
  if (s === 'good' || s === 'shortlisted') return 'good';
  if (s === 'waiting' || s === 'interviewing' || s === 'scheduled' || s === 'interview_scheduled' || s === 'under_review') return 'waiting';
  if (s === 'hired') return 'hired';
  if (s === 'rejected') return 'rejected';
  return 'new';
};

const statusConfig: Record<CandidateStatus, { label: string; shortLabel: string; badgeClass: string; dotClass: string }> = {
  new: { 
    label: 'New Applications', 
    shortLabel: 'New',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    dotClass: 'bg-zinc-400' 
  },
  good: { 
    label: 'Good Fit', 
    shortLabel: 'Good Fit',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500' 
  },
  waiting: { 
    label: 'Under Review', 
    shortLabel: 'Review',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500' 
  },
  hired: { 
    label: 'Hired', 
    shortLabel: 'Hired',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500' 
  },
  rejected: { 
    label: 'Rejected', 
    shortLabel: 'Rejected',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    dotClass: 'bg-red-500' 
  },
};

const kanbanColumns: { status: CandidateStatus; title: string }[] = [
  { status: 'new', title: 'New Applications' },
  { status: 'good', title: 'Good Fit' },
  { status: 'waiting', title: 'Under Review' },
  { status: 'hired', title: 'Hired' },
  { status: 'rejected', title: 'Rejected' },
];

const TalentPool = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(jobId || 'all');
  const [loading, setLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // Realtime interviews & account sync (user-scoped)
  const [interviews, setInterviews] = useState<Interview[]>(() => getInterviews(user?.id));
  const [connectedAcc, setConnectedAcc] = useState<ConnectedRecruiterAccount | null>(() => getConnectedAccount(user?.id));

  useEffect(() => {
    setInterviews(getInterviews(user?.id));
    setConnectedAcc(getConnectedAccount(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const handleSync = () => {
      setInterviews(getInterviews(user?.id));
      setConnectedAcc(getConnectedAccount(user?.id));
    };
    window.addEventListener('local_interviews_updated', handleSync);
    window.addEventListener('unified_account_updated', handleSync);
    return () => {
      window.removeEventListener('local_interviews_updated', handleSync);
      window.removeEventListener('unified_account_updated', handleSync);
    };
  }, [user?.id]);

  const hasGoogle = connectedAcc?.status === 'active' && connectedAcc?.provider === 'google';
  const hasMicrosoft = connectedAcc?.status === 'active' && connectedAcc?.provider === 'microsoft';

  // Direct Quick Interview Scheduling State
  const [scheduleCandidate, setScheduleCandidate] = useState<Candidate | null>(null);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [scheduleFormat, setScheduleFormat] = useState<'google_meet' | 'teams' | 'phone' | 'physical'>('google_meet');
  const [schedulePhone, setSchedulePhone] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('Headquarters - Main Conference Room (Floor 3)');
  const [isScheduling, setIsScheduling] = useState(false);

  const handleOpenDirectSchedule = (cand: Candidate) => {
    setScheduleCandidate(cand);
    setSchedulePhone(cand.phone || '');

    // Strictly match interview by candidate_id to prevent phantom interviews across candidates
    const existing = interviews.find(i => i.candidate_id === cand.id);

    if (existing) {
      setScheduleDate(existing.date);
      setScheduleTime(existing.time);
      if (existing.meeting_format === 'google_meet' && hasGoogle) {
        setScheduleFormat('google_meet');
      } else if (existing.meeting_format === 'teams' && hasMicrosoft) {
        setScheduleFormat('teams');
      } else if (existing.meeting_format === 'in_person') {
        setScheduleFormat('physical');
        if (existing.location) setScheduleLocation(existing.location);
      } else {
        setScheduleFormat('phone');
        if (existing.phone_number) setSchedulePhone(existing.phone_number);
      }
    } else {
      if (hasGoogle) {
        setScheduleFormat('google_meet');
      } else if (hasMicrosoft) {
        setScheduleFormat('teams');
      } else {
        setScheduleFormat('phone');
      }
    }
  };

  const candidateInterview = useMemo(() => {
    if (!selectedCandidate) return null;
    return interviews.find(i => i.candidate_id === selectedCandidate.id) || null;
  }, [interviews, selectedCandidate]);

  const handleConfirmDirectSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleCandidate) return;

    setIsScheduling(true);
    const candidateJob = jobs.find(j => j.id === scheduleCandidate.job_id);
    const acc = getConnectedAccount(user?.id);
    const hostRecruiter = acc?.email || user?.email || 'recruiter@hireforce.ai';

    let meetingLink: string | undefined = undefined;

    const newInterview = {
      id: `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      candidate_id: scheduleCandidate.id,
      candidate_name: scheduleCandidate.full_name,
      candidate_email: scheduleCandidate.email,
      job_id: scheduleCandidate.job_id || candidateJob?.id || 'sample-job',
      job_title: candidateJob?.title || 'Evaluated Position',
      round_type: 'Technical Round' as const,
      date: scheduleDate,
      time: scheduleTime,
      duration_minutes: 45,
      meeting_format: (scheduleFormat === 'physical' ? 'in_person' : scheduleFormat) as any,
      meeting_link: meetingLink,
      phone_number: scheduleFormat === 'phone' ? (schedulePhone || scheduleCandidate.phone) : undefined,
      location: scheduleFormat === 'physical' ? scheduleLocation : undefined,
      status: 'Scheduled' as const,
      interviewer: hostRecruiter || 'Talent Acquisition Team',
      notes: scheduleFormat === 'phone'
        ? `Phone interview with ${scheduleCandidate.full_name} at ${schedulePhone || scheduleCandidate.phone}.`
        : scheduleFormat === 'physical'
        ? `Physical in-person interview with ${scheduleCandidate.full_name} at ${scheduleLocation}.`
        : `Direct video interview scheduled for ${scheduleCandidate.full_name}.`,
    };

    try {
      const createdInterview = await saveInterviewAsync(newInterview, user?.id);
      const finalMeetingLink = createdInterview.meeting_link || meetingLink;

      // Recruitment Automation: Interview Invitation
      try {
        const candidateJob = jobs.find(j => j.id === scheduleCandidate.job_id);
        const meetingDetails = scheduleFormat === 'physical'
          ? (scheduleLocation || 'Company Office')
          : (scheduleFormat === 'phone' ? (schedulePhone || scheduleCandidate.phone || 'Phone') : (finalMeetingLink || ''));

        triggerAutomation('interview_scheduled', {
          candidate_id: scheduleCandidate.id,
          candidate_name: scheduleCandidate.full_name,
          candidate_email: scheduleCandidate.email,
          job_title: candidateJob?.title || 'Evaluated Position',
          company_name: user?.companyName || 'HireForce',
          round_type: 'Technical Round',
          meeting_format: scheduleFormat === 'teams' ? 'Microsoft Teams' : (scheduleFormat === 'phone' ? 'Phone Interview' : (scheduleFormat === 'physical' ? 'Physical On-site' : 'Google Meet')),
          meeting_link_or_address: meetingDetails,
          interview_date_time: `${scheduleDate} at ${scheduleTime}`,
          user_id: user?.id,
          recruiter_id: user?.id,
          recruiter_name: user?.fullName || user?.companyName || 'Hiring Team',
        });
      } catch (err) {
        console.warn('Failed to trigger interview_scheduled automation:', err);
      }

      // Update candidate stage to 'waiting' (Interview stage)
      try {
        updateCandidateStatus(scheduleCandidate.id, 'waiting');
      } catch {}

      showSuccess(`Interview scheduled with ${scheduleCandidate.full_name}! Added to your calendar.`);
      setScheduleCandidate(null);
    } catch (schedErr: any) {
      console.error('Interview schedule error:', schedErr);
      showError(schedErr.message || 'Failed to schedule interview');
    } finally {
      setIsScheduling(false);
    }
  };

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isReScreening, setIsReScreening] = useState(false);

  const handleReScreenCandidate = async (candidate: Candidate) => {
    setIsReScreening(true);
    try {
      const candidateJob = jobs.find(j => j.id === candidate.job_id);
      const res = await screenCandidateWithAI({
        candidateId: candidate.id,
        jobId: candidate.job_id,
        jobTitle: candidateJob?.title || 'Target Role',
        candidateName: candidate.full_name,
        candidateEmail: candidate.email,
        resumeUrl: candidate.resume_url,
        userId: candidate.user_id,
      });

      if (res?.screening) {
        showSuccess(`AI screening re-evaluation complete for ${candidate.full_name}!`);
        if (selectedCandidate?.id === candidate.id) {
          setSelectedCandidate(prev => prev ? ({
            ...prev,
            screening_score: res.screening.score,
            screening_summary: res.screening.summary,
          }) : null);
        }
      } else {
        showError('Screening service was unable to evaluate profile.');
      }
    } catch {
      showError('Failed to run AI evaluation.');
    } finally {
      setIsReScreening(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setCandidatesLoading(true);
    
    const unsubscribeJobs = subscribeToJobs((updatedJobs) => {
      setJobs(updatedJobs);
      setLoading(false);
    }, user?.id);

    const unsubscribeCandidates = subscribeToCandidates((updatedCandidates) => {
      setCandidates(updatedCandidates);
      setCandidatesLoading(false);
    }, user?.id);

    return () => {
      unsubscribeJobs();
      unsubscribeCandidates();
    };
  }, [user?.id]);

  // Sync selectedJobId if URL parameter changes
  useEffect(() => {
    if (jobId) {
      setSelectedJobId(jobId);
    }
  }, [jobId]);

  // Keep selected candidate synced
  useEffect(() => {
    if (!selectedCandidate) return;
    const latest = candidates.find(c => c.id === selectedCandidate.id);
    if (latest) {
      setSelectedCandidate(latest);
    }
  }, [candidates]);

  // Handle pipeline selection change
  const handleSelectPipeline = (newJobId: string) => {
    setSelectedJobId(newJobId);
    if (newJobId === 'all') {
      navigate('/talent-pool');
    } else {
      navigate(`/talent-pool/${newJobId}`);
    }
  };

  const currentJob = useMemo(() => {
    if (selectedJobId === 'all') return null;
    return jobs.find(j => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  // Candidates filtered by selected job pipeline
  const pipelineCandidates = useMemo(() => {
    // Defense-in-depth: enforce strict tenant isolation so candidates from other recruiters are never displayed
    const recruiterJobIds = new Set(jobs.map(j => j.id));
    const owned = candidates.filter(c => {
      if (user?.id && user.id !== 'admin-001') {
        if (c.user_id && c.user_id !== user.id) return false;
      }
      if (c.job_id && jobs.length > 0 && !recruiterJobIds.has(c.job_id)) return false;
      return true;
    });

    if (selectedJobId === 'all') return owned;
    return owned.filter(c => c.job_id === selectedJobId);
  }, [candidates, jobs, selectedJobId, user?.id]);

  // Candidates further filtered by search query and optional stage filter
  const filteredCandidates = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return pipelineCandidates.filter(c => {
      const matchesSearch = !q ||
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.screening_summary?.toLowerCase().includes(q) ||
        (c.screening_score?.toString() || '').includes(q);

      const matchesStage = stageFilter === 'all' || 
        normalizeStatus(c.status) === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [pipelineCandidates, searchQuery, stageFilter]);

  // Candidates in the same stage queue as selected candidate
  const stageQueue = useMemo(() => {
    if (!selectedCandidate) return [];
    const currentStatus = normalizeStatus(selectedCandidate.status);
    return filteredCandidates.filter(c => {
      const st = normalizeStatus(c.status);
      return st === currentStatus;
    });
  }, [filteredCandidates, selectedCandidate]);

  const currentIndex = useMemo(() => {
    if (!selectedCandidate || stageQueue.length === 0) return -1;
    return stageQueue.findIndex(c => c.id === selectedCandidate.id);
  }, [stageQueue, selectedCandidate]);

  const handlePrevCandidate = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedCandidate(stageQueue[currentIndex - 1]);
    }
  }, [currentIndex, stageQueue]);

  const handleNextCandidate = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < stageQueue.length - 1) {
      setSelectedCandidate(stageQueue[currentIndex + 1]);
    }
  }, [currentIndex, stageQueue]);

  // Keyboard arrow navigation
  useEffect(() => {
    if (!selectedCandidate) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevCandidate();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextCandidate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCandidate, handlePrevCandidate, handleNextCandidate]);

  const handleUpdateStatus = async (candidateId: string, newStatus: CandidateStatus, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateCandidateStatus(candidateId, newStatus);
      showSuccess(`Moved to ${statusConfig[newStatus].label}`);

      if (newStatus === 'rejected') {
        const cand = candidates.find(c => c.id === candidateId);
        if (cand) {
          const candidateJob = jobs.find(j => j.id === cand.job_id);
          try {
            triggerAutomation('candidate_rejected', {
              candidate_id: cand.id,
              candidate_name: cand.full_name,
              candidate_email: cand.email,
              job_title: candidateJob?.title || 'Applied Position',
              company_name: user?.companyName || 'HireForce',
              user_id: user?.id,
              recruiter_id: user?.id,
              recruiter_name: user?.fullName || user?.companyName || 'Hiring Team',
            });
          } catch (autoErr) {
            console.warn('Failed to trigger candidate_rejected automation:', autoErr);
          }
        }
      }
    } catch {
      showError('Failed to update stage');
    }
  };

  const copyApplicationLink = async () => {
    const link = currentJob 
      ? `${window.location.origin}/apply/${currentJob.id}`
      : `${window.location.origin}/apply`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      showSuccess('Application link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleAddTestCandidate = () => {
    const targetJobId = currentJob ? currentJob.id : (jobs[0]?.id || 'sample-job');
    const names = ['Sarah Jenkins', 'Alex Rivera', 'Michael Chang', 'Elena Rostova', 'David Miller'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomScore = Math.floor(Math.random() * 25) + 75;

    saveLocalCandidate({
      full_name: randomName,
      email: `${randomName.toLowerCase().replace(' ', '.')}@example.com`,
      phone: '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
      job_id: targetJobId,
      screening_score: randomScore,
      status: randomScore >= 85 ? 'good' : 'new',
      screening_summary: `Candidate screening assessment for ${currentJob?.title || 'role'}. Demonstrates strong core competencies, relevant tooling exposure, and problem-solving qualifications.`,
      resume_url: '/sample-resume.pdf',
    });
    showSuccess(`Added applicant: ${randomName} (${randomScore}% match)`);
  };

  const getCandidateJobTitle = (candJobId: string) => {
    return jobs.find(j => j.id === candJobId)?.title || 'General';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center text-xs text-zinc-400">
            <Loader2 className="animate-spin text-emerald-600 mx-auto mb-2" size={24} />
            <p>Loading candidate pipelines...</p>
          </div>
        </div>
        
    </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Candidates & Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review applicant screening scores, track evaluations, and manage stages across roles.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-md border border-zinc-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all",
                viewMode === 'kanban' ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <LayoutGrid size={13} />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all",
                viewMode === 'table' ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <List size={13} />
              Table
            </button>
          </div>

          {currentJob && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyApplicationLink}
              className="h-8 px-2.5 rounded-md border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 gap-1.5"
            >
              {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copiedLink ? 'Copied' : 'Apply Link'}</span>
            </Button>
          )}

          <CsvExport 
            candidates={pipelineCandidates} 
            jobTitle={currentJob?.title || 'All_Candidates'} 
          />

          {currentJob && (
            <DeleteJobData 
              jobId={currentJob.id} 
              candidates={pipelineCandidates} 
              onDelete={() => handleSelectPipeline('all')} 
            />
          )}
        </div>
      </div>

      {/* Role Pipeline Selector Filter Bar */}
      <div className="p-3 bg-white border border-zinc-200/90 rounded-lg shadow-2xs mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Dropdown Pipeline Selector */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <span className="text-xs font-bold text-zinc-700 whitespace-nowrap flex items-center gap-1.5">
            <Briefcase size={14} className="text-emerald-600" />
            Pipeline:
          </span>
          <Select value={selectedJobId} onValueChange={handleSelectPipeline}>
            <SelectTrigger className="h-9 text-sm bg-zinc-50/80 border-zinc-200 focus:ring-emerald-500 font-medium">
              <SelectValue placeholder="Select a job pipeline..." />
            </SelectTrigger>
            <SelectContent className="text-sm">
              <SelectItem value="all">
                All Pipelines & Roles ({candidates.length} total)
              </SelectItem>
              {jobs.map((j) => {
                const count = candidates.filter(c => c.job_id === j.id).length;
                return (
                  <SelectItem key={j.id} value={j.id}>
                    {j.title} ({count} {count === 1 ? 'candidate' : 'candidates'})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Stage Metric Quick Counters */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <button
            onClick={() => setStageFilter('all')}
            className={cn(
              "px-2 py-0.5 rounded-md font-semibold transition-all border",
              stageFilter === 'all'
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
            )}
          >
            All ({pipelineCandidates.length})
          </button>
          {(['new', 'good', 'waiting', 'hired', 'rejected'] as CandidateStatus[]).map((st) => {
            const count = pipelineCandidates.filter(c => normalizeStatus(c.status) === st).length;
            const isSelected = stageFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStageFilter(isSelected ? 'all' : st)}
                className={cn(
                  "px-2 py-0.5 rounded-md font-semibold transition-all border flex items-center gap-1",
                  isSelected
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig[st].dotClass)} />
                <span>{statusConfig[st].shortLabel} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton while candidates are being retrieved */}
      {(candidatesLoading || loading) && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-6 animate-pulse mb-4">
          {kanbanColumns.map(col => (
            <div key={col.status} className="bg-zinc-100/60 rounded-lg p-2.5 flex flex-col min-w-[215px] border border-zinc-200/50 space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-zinc-400">{col.title}</span>
                <div className="w-4 h-4 rounded bg-zinc-200" />
              </div>
              <div className="p-3 bg-white rounded-lg border border-zinc-200/60 space-y-2 shadow-2xs">
                <div className="h-3.5 bg-zinc-200 rounded w-3/4" />
                <div className="h-2.5 bg-zinc-100 rounded w-1/2" />
                <div className="h-2 bg-zinc-100 rounded w-full" />
              </div>
              <div className="p-3 bg-white rounded-lg border border-zinc-200/60 space-y-2 shadow-2xs opacity-60">
                <div className="h-3.5 bg-zinc-200 rounded w-2/3" />
                <div className="h-2.5 bg-zinc-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State Banner when 0 candidates */}
      {!candidatesLoading && !loading && pipelineCandidates.length === 0 && (
        <div className="p-4 rounded-lg bg-white border border-zinc-200/90 shadow-2xs mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900">
                {currentJob ? `No candidates yet for ${currentJob.title}` : 'No candidates in the database'}
              </p>
              <p className="text-[11px] text-zinc-500">
                Simulate a test applicant or share your application link to populate this pipeline.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentJob && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`${window.location.origin}/apply/${currentJob.id}`, '_blank')}
                className="h-7 text-xs border-zinc-200 gap-1"
              >
                <ExternalLink size={12} />
                Open Form
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleAddTestCandidate}
              className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1 shadow-2xs"
            >
              <PlusCircle size={12} />
              Add Test Candidate
            </Button>
          </div>
        </div>
      )}

      {/* Search Filter Toolbar */}
      {pipelineCandidates.length > 0 && (
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Search candidate name, email, keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-sm rounded-md bg-white border-zinc-200 focus-visible:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddTestCandidate}
              className="h-8 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
            >
              <PlusCircle size={13} />
              Add Candidate
            </Button>
            <div className="text-xs text-zinc-500 font-medium">
              Showing <span className="font-semibold text-zinc-800">{filteredCandidates.length}</span> of {pipelineCandidates.length}
            </div>
          </div>
        </div>
      )}

      {/* KANBAN BOARD */}
      {!candidatesLoading && !loading && viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-6">
          {kanbanColumns.map(col => {
            const columnCandidates = filteredCandidates.filter(c => {
              const currentStatus = normalizeStatus(c.status);
              return currentStatus === col.status;
            });

            return (
              <div key={col.status} className="bg-zinc-100/60 rounded-lg p-2.5 flex flex-col min-w-[215px] border border-zinc-200/50">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-xs font-bold text-zinc-800">{col.title}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700">
                    {columnCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards Stack */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-320px)]">
                  {columnCandidates.map(c => {
                    const score = c.screening_score;
                    const isHigh = score !== null && score >= 80;
                    const isMed = score !== null && score >= 60 && score < 80;
                    const currentStatus = normalizeStatus(c.status);

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCandidate(c)}
                        className="p-3 bg-white border border-zinc-200/90 rounded-md shadow-2xs hover:border-emerald-500/50 hover:shadow-sm cursor-pointer transition-all space-y-2 group"
                      >
                        {/* Candidate Name & Match Badge */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors truncate">
                              {c.full_name}
                            </h4>
                            <p className="text-[11px] text-zinc-400 truncate">
                              {selectedJobId === 'all' ? getCandidateJobTitle(c.job_id) : c.email}
                            </p>
                          </div>
                          {score !== null ? (
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0",
                              isHigh 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : isMed 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            )}>
                              {score}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded animate-pulse">
                              <Sparkles size={9} className="text-emerald-600 animate-spin" />
                              Screening…
                            </span>
                          )}
                        </div>

                        {/* AI Summary snippet */}
                        {c.screening_summary && (
                          <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed bg-zinc-50 p-1.5 rounded border border-zinc-100">
                            {c.screening_summary}
                          </p>
                        )}

                        {/* Scheduled Interview Indicator Badge on Kanban Card */}
                        {(() => {
                          const cInt = interviews.find(i => i.candidate_id === c.id);
                          if (!cInt) return null;
                          return (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDirectSchedule(c);
                              }}
                              className={cn(
                                "px-2 py-1 rounded text-[11px] font-semibold border flex items-center justify-between gap-1 cursor-pointer transition-all shadow-2xs",
                                cInt.meeting_format === 'phone'
                                  ? "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                                  : cInt.meeting_format === 'teams'
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100"
                                  : cInt.meeting_format === 'in_person'
                                  ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              )}
                              title="Click to view/reschedule interview"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {cInt.meeting_format === 'phone' ? <Phone size={11} className="text-blue-600 shrink-0" /> :
                                 cInt.meeting_format === 'in_person' ? <MapPin size={11} className="text-amber-600 shrink-0" /> :
                                 <Video size={11} className="text-emerald-600 shrink-0" />}
                                <span className="truncate">Interview: {cInt.date} ({cInt.time})</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 font-mono shrink-0">&rarr;</span>
                            </div>
                          );
                        })()}

                        {/* Stage Selector & Quick Schedule */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center gap-1.5">
                          <div className="flex-1 min-w-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button 
                                  className="w-full inline-flex items-center justify-between px-2.5 py-1 rounded-md border border-zinc-200/90 bg-zinc-50 hover:bg-zinc-100/80 text-zinc-700 text-xs font-semibold transition-all"
                                  title="Click to update candidate stage"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusConfig[currentStatus]?.dotClass)} />
                                    <span className="truncate">{statusConfig[currentStatus]?.label}</span>
                                  </span>
                                  <ChevronDown size={11} className="text-zinc-400 flex-shrink-0 ml-1" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="text-xs w-48 shadow-lg">
                                <DropdownMenuLabel className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1">
                                  Update Stage
                                </DropdownMenuLabel>
                                {(['new', 'good', 'waiting', 'hired', 'rejected'] as CandidateStatus[]).map((st) => (
                                  <DropdownMenuItem 
                                    key={st}
                                    onClick={(e) => handleUpdateStatus(c.id, st, e)}
                                    className="flex items-center justify-between text-xs py-1.5 px-2 cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={cn("w-2 h-2 rounded-full", statusConfig[st].dotClass)} />
                                      <span className="font-medium text-zinc-800">{statusConfig[st].label}</span>
                                    </div>
                                    {currentStatus === st && <Check size={13} className="text-emerald-600" />}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDirectSchedule(c);
                            }}
                            className="inline-flex items-center justify-center p-1.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex-shrink-0"
                            title="Schedule Interview"
                          >
                            <CalendarIcon size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {columnCandidates.length === 0 && (
                    <div className="p-3 text-center text-[10px] text-zinc-400 border border-dashed border-zinc-200/80 rounded">
                      No candidates in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SPREADSHEET TABLE VIEW */}
      {!candidatesLoading && !loading && viewMode === 'table' && (
        <div className="bg-white border border-zinc-200/90 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Candidate</th>
                  <th className="py-2.5 px-4">Pipeline Role</th>
                  <th className="py-2.5 px-4">AI Score</th>
                  <th className="py-2.5 px-4">Stage</th>
                  <th className="py-2.5 px-4 min-w-[260px]">AI Assessment</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCandidates.map(c => {
                  const score = c.screening_score;
                  const isHigh = score !== null && score >= 80;
                  const isMed = score !== null && score >= 60 && score < 80;
                  const currentStatus = normalizeStatus(c.status);

                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => setSelectedCandidate(c)}
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-zinc-900">
                        <div>{c.full_name}</div>
                        <div className="text-[11px] font-normal text-zinc-400">{c.email}</div>
                      </td>
                      <td className="py-3 px-4 text-zinc-700 font-medium">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 text-[11px]">
                          {getCandidateJobTitle(c.job_id)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {score !== null ? (
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold",
                            isHigh 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : isMed 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          )}>
                            {score}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border bg-white border-zinc-200 hover:bg-zinc-50">
                              <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig[currentStatus]?.dotClass)} />
                              <span>{statusConfig[currentStatus]?.label || 'New'}</span>
                              <ChevronDown size={11} className="text-zinc-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="text-xs w-48">
                            {(['new', 'good', 'waiting', 'hired', 'rejected'] as CandidateStatus[]).map((st) => (
                              <DropdownMenuItem 
                                key={st}
                                onClick={(e) => handleUpdateStatus(c.id, st, e)}
                                className="flex items-center justify-between text-xs py-1.5"
                              >
                                <div className="flex items-center gap-2">
                                  <span className={cn("w-2 h-2 rounded-full", statusConfig[st].dotClass)} />
                                  <span>{statusConfig[st].label}</span>
                                </div>
                                {currentStatus === st && <Check size={12} className="text-emerald-600" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 max-w-sm truncate text-[11px]">
                        {c.screening_summary || 'No AI screening report generated yet.'}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {c.phone || c.email}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDirectSchedule(c);
                            }}
                            className="p-1 rounded text-zinc-500 hover:text-emerald-600 hover:bg-zinc-100"
                            title="Schedule Interview"
                          >
                            <CalendarIcon size={14} />
                          </button>
                          {c.resume_url && (
                            <a
                              href={c.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded text-zinc-500 hover:text-emerald-600 hover:bg-zinc-100"
                              title="Open Resume"
                            >
                              <FileText size={14} />
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCandidate(c)}
                            className="h-7 text-xs border-zinc-200 text-zinc-700 hover:text-emerald-600"
                          >
                            Inspect
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CENTERED POPUP MODAL (Concept 3 Profile Inspector) */}
      <Dialog open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
        <DialogContent className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto bg-white p-0 rounded-xl border border-zinc-200 shadow-xl">
          {selectedCandidate && (
            <div>
              {/* Top Navigation & Queue Bar */}
              <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/80 flex items-center justify-between rounded-t-xl pr-14">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-zinc-500">
                    Candidate <span className="font-bold text-zinc-900">{currentIndex + 1}</span> of <span className="font-bold text-zinc-900">{stageQueue.length}</span>
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-zinc-600 font-medium">
                    Queue: <span className="font-semibold text-zinc-800">{statusConfig[normalizeStatus(selectedCandidate.status)]?.label}</span>
                  </span>
                </div>

                {/* Left & Right Queue Buttons */}
                <div className="flex items-center gap-1.5 mr-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevCandidate}
                    disabled={currentIndex <= 0}
                    className="h-7 px-2.5 text-xs rounded border-zinc-200 text-zinc-700 hover:bg-white disabled:opacity-30 gap-1 font-medium shadow-2xs"
                    title="Previous candidate in this stage (Left Arrow)"
                  >
                    <ChevronLeft size={13} />
                    <span>Prev</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextCandidate}
                    disabled={currentIndex < 0 || currentIndex >= stageQueue.length - 1}
                    className="h-7 px-2.5 text-xs rounded border-zinc-200 text-zinc-700 hover:bg-white disabled:opacity-30 gap-1 font-medium shadow-2xs"
                    title="Next candidate in this stage (Right Arrow)"
                  >
                    <span>Next</span>
                    <ChevronRight size={13} />
                  </Button>
                </div>
              </div>

              {/* Main Profile Body */}
              <div className="p-6 space-y-5">
                {/* Header Info */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-zinc-900">
                      {selectedCandidate.full_name}
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Applied for <span className="font-semibold text-zinc-700">{getCandidateJobTitle(selectedCandidate.job_id)}</span>
                    </p>
                  </div>
                  {selectedCandidate.screening_score !== null && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-emerald-600">
                        {selectedCandidate.screening_score}%
                      </div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Match Score
                      </div>
                    </div>
                  )}
                </div>

                {/* Unified Single Pipeline Stage Selector */}
                <div>
                  <label className="text-sm font-bold text-zinc-800 block mb-2">
                    Pipeline Stage
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['new', 'good', 'waiting', 'hired', 'rejected'] as CandidateStatus[]).map((st) => {
                      const isSelected = normalizeStatus(selectedCandidate.status) === st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(selectedCandidate.id, st)}
                          className={cn(
                            "h-9 px-1 rounded-md text-xs font-semibold border transition-all text-center flex items-center justify-center gap-1.5",
                            isSelected
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusConfig[st].dotClass)} />
                          <span className="truncate text-xs">{statusConfig[st].shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Screening Assessment - Comprehensive Evaluation Dossier */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/90 to-teal-50/70 border border-emerald-200/90 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Sparkles size={13} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">AI Screening Evaluation Dossier</span>
                        <span className="text-[10px] text-emerald-700">Comprehensive ATS assessment & role readiness</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedCandidate.screening_score !== null && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                          {selectedCandidate.screening_score}% Match
                        </span>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isReScreening}
                        onClick={() => handleReScreenCandidate(selectedCandidate)}
                        className="h-7 px-2.5 text-[11px] font-semibold bg-white hover:bg-emerald-100/60 text-emerald-800 border-emerald-300 gap-1.5 shadow-2xs cursor-pointer"
                        title="Re-run deep AI screening analysis for this candidate"
                      >
                        {isReScreening ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-emerald-600" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw size={12} className="text-emerald-600" />
                            <span>Re-Screen with AI</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Formatted Assessment Body */}
                  <div className="p-3.5 rounded-lg bg-white/95 border border-emerald-100 text-xs text-zinc-800 leading-relaxed space-y-3 shadow-2xs">
                    {(() => {
                      const summaryText = selectedCandidate.screening_summary || "No AI screening report generated for this candidate profile yet.";
                      
                      const hasSections = summaryText.includes('Executive Summary:') || summaryText.includes('Key Strengths') || summaryText.includes('Recommended Interview');

                      if (!hasSections) {
                        return (
                          <div className="space-y-2">
                            <p className="text-zinc-800 leading-relaxed whitespace-pre-wrap">{summaryText}</p>
                            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                              <span>Profile evaluated for: <strong className="text-zinc-800">{getCandidateJobTitle(selectedCandidate.job_id)}</strong></span>
                              <span className="text-emerald-700 font-medium">Click "Re-Screen with AI" above to generate full breakdown.</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3 text-xs">
                          {summaryText.split('\n\n').map((block, idx) => {
                            const trimmed = block.trim();
                            if (!trimmed) return null;

                            if (trimmed.startsWith('Executive Summary:')) {
                              const content = trimmed.replace(/^Executive Summary:\s*/i, '');
                              return (
                                <div key={idx} className="space-y-1">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Executive Summary</span>
                                  <p className="text-zinc-800 leading-relaxed font-medium bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/60">
                                    {content}
                                  </p>
                                </div>
                              );
                            }

                            if (trimmed.startsWith('Key Strengths') || trimmed.includes('Qualifications:')) {
                              const lines = trimmed.split('\n').filter(l => l.trim());
                              const title = lines[0];
                              const items = lines.slice(1);
                              return (
                                <div key={idx} className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{title.replace(':', '')}</span>
                                  <div className="space-y-1">
                                    {items.map((item, itemIdx) => (
                                      <div key={itemIdx} className="flex items-start gap-2 text-zinc-700 bg-zinc-50/70 p-2 rounded-lg border border-zinc-100">
                                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                        <span className="leading-snug">{item.replace(/^[•\-\*]\s*/, '')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            if (trimmed.startsWith('Recommended Interview') || trimmed.includes('Focus:')) {
                              const lines = trimmed.split('\n').filter(l => l.trim());
                              const title = lines[0];
                              const questions = lines.slice(1);
                              return (
                                <div key={idx} className="space-y-1.5">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">{title.replace(':', '')}</span>
                                  <div className="space-y-1">
                                    {questions.map((q, qIdx) => (
                                      <div key={qIdx} className="flex items-start gap-2 text-zinc-700 bg-indigo-50/40 p-2 rounded-lg border border-indigo-100/60">
                                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                          {qIdx + 1}
                                        </span>
                                        <span className="leading-snug">{q.replace(/^\d+[\.\)]\s*/, '')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            if (trimmed.startsWith('Recommendation:')) {
                              return (
                                <div key={idx} className="p-2.5 rounded-lg bg-emerald-100/60 border border-emerald-300 text-emerald-950 font-bold text-xs flex items-center gap-2">
                                  <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                                  <span>{trimmed}</span>
                                </div>
                              );
                            }

                            return (
                              <p key={idx} className="text-zinc-800 leading-relaxed whitespace-pre-wrap">{trimmed}</p>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded bg-zinc-50 border border-zinc-100">
                    <span className="text-zinc-500 flex items-center gap-1.5">
                      <Mail size={13} /> Email
                    </span>
                    <a href={`mailto:${selectedCandidate.email}`} className="font-semibold text-zinc-800 hover:text-emerald-600">
                      {selectedCandidate.email}
                    </a>
                  </div>

                  {selectedCandidate.phone && (
                    <div className="flex items-center justify-between p-2.5 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <Phone size={13} /> Phone
                      </span>
                      <a href={`tel:${selectedCandidate.phone}`} className="font-semibold text-zinc-800 hover:text-emerald-600">
                        {selectedCandidate.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Active Scheduled Interview Banner / Actions */}
                {candidateInterview ? (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                          Interview Confirmed & Scheduled
                        </span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                        {candidateInterview.status || 'Scheduled'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white/80 border border-emerald-100 space-y-0.5">
                        <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Date & Time</span>
                        <div className="font-bold text-zinc-900 flex items-center gap-1">
                          <CalendarIcon size={12} className="text-emerald-600" />
                          <span>{candidateInterview.date} at {candidateInterview.time}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-white/80 border border-emerald-100 space-y-0.5">
                        <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Meeting Format</span>
                        <div className="font-bold text-zinc-900 flex items-center gap-1 truncate">
                          {candidateInterview.meeting_format === 'phone' ? (
                            <>
                              <Phone size={12} className="text-blue-600 shrink-0" />
                              <span className="truncate">Phone ({candidateInterview.phone_number || selectedCandidate.phone})</span>
                            </>
                          ) : candidateInterview.meeting_format === 'teams' ? (
                            <>
                              <Video size={12} className="text-indigo-600 shrink-0" />
                              <span>Microsoft Teams</span>
                            </>
                          ) : candidateInterview.meeting_format === 'in_person' ? (
                            <>
                              <MapPin size={12} className="text-amber-600 shrink-0" />
                              <span className="truncate">Physical ({candidateInterview.location || 'Office'})</span>
                            </>
                          ) : (
                            <>
                              <Video size={12} className="text-emerald-600 shrink-0" />
                              <span>Google Meet</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Explicit Meeting Room Link Bar with 1-Click Copy */}
                    {candidateInterview.meeting_link && candidateInterview.meeting_format !== 'phone' && (
                      <div className="p-2.5 rounded-lg bg-white/90 border border-emerald-200/90 flex items-center justify-between gap-2 shadow-2xs">
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
                            Meeting Link (Candidate & Recruiter)
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Video size={13} className={candidateInterview.meeting_format === 'teams' ? "text-indigo-600 shrink-0" : "text-emerald-600 shrink-0"} />
                            <span className="text-[11px] font-mono font-medium text-zinc-800 truncate select-all">
                              {candidateInterview.meeting_link}
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(candidateInterview.meeting_link || '');
                            showSuccess('Meeting link copied to clipboard!');
                          }}
                          className="h-7 px-2.5 text-xs font-semibold border-zinc-200 text-zinc-700 hover:bg-zinc-100 gap-1.5 shrink-0 cursor-pointer"
                          title="Copy meeting link to share with candidate"
                        >
                          <Copy size={12} />
                          <span>Copy Link</span>
                        </Button>
                      </div>
                    )}

                    {/* Quick Launch / Dial Row */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {candidateInterview.meeting_format === 'phone' ? (
                        <a
                          href={`tel:${candidateInterview.phone_number || selectedCandidate.phone}`}
                          className="flex-1 min-w-[120px] h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Phone size={13} />
                          <span>Dial Candidate</span>
                        </a>
                      ) : candidateInterview.meeting_link ? (
                        <a
                          href={candidateInterview.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "flex-1 min-w-[120px] h-8 rounded-md text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-2xs",
                            candidateInterview.meeting_format === 'teams' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
                          )}
                        >
                          <Video size={13} />
                          <span>Join {candidateInterview.meeting_format === 'teams' ? 'Teams' : 'Meet'}</span>
                        </a>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDirectSchedule(selectedCandidate)}
                        className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 font-semibold"
                      >
                        Reschedule
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/calendar')}
                        className="h-8 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-100 font-semibold"
                      >
                        Calendar &rarr;
                      </Button>

                      {selectedCandidate.resume_url && (
                        <a
                          href={selectedCandidate.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 px-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all shadow-xs"
                        >
                          <FileText size={13} />
                          Resume
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {selectedCandidate.resume_url ? (
                      <a
                        href={selectedCandidate.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <FileText size={14} />
                        Open Resume
                      </a>
                    ) : (
                      <div />
                    )}
                    <Button
                      type="button"
                      onClick={() => handleOpenDirectSchedule(selectedCandidate)}
                      className="h-9 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CalendarIcon size={14} />
                      Schedule Interview
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer Hint Bar */}
              <div className="px-6 py-2.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-[11px] text-zinc-400 rounded-b-xl">
                <span>Tip: Use <kbd className="px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700 font-mono text-[10px]">&larr;</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700 font-mono text-[10px]">&rarr;</kbd> keys to cycle queue</span>
                <span className="font-medium text-zinc-500">Press ESC to close</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
          {/* Quick Schedule Interview Dialog directly from Candidate Profile */}
      <Dialog open={!!scheduleCandidate} onOpenChange={(open) => !open && setScheduleCandidate(null)}>
        <DialogContent className="sm:max-w-md bg-white p-6 rounded-xl border border-zinc-200 shadow-xl">
          <div className="text-left space-y-1 mb-3">
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <CalendarIcon size={18} className="text-emerald-600" />
              Schedule Interview for {scheduleCandidate?.full_name}
            </h3>
            <p className="text-xs text-zinc-500">
              Pre-filled from applicant pipeline. Automatically adds the interview event to your calendar.
            </p>
          </div>

          {scheduleCandidate && (
            <form onSubmit={handleConfirmDirectSchedule} className="space-y-4 text-xs">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Candidate:</span>
                  <span className="font-bold text-zinc-900">{scheduleCandidate.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Email:</span>
                  <span className="text-zinc-700 font-mono">{scheduleCandidate.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Role:</span>
                  <span className="text-zinc-800 font-medium">{jobs.find(j => j.id === scheduleCandidate.job_id)?.title || 'Evaluated Position'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block">Date</label>
                  <Input 
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 block">Time</label>
                  <Input 
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="h-8 text-xs bg-white"
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

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-700 block">Interview Method / Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: Google Meet (Only if Google is connected) */}
                  {hasGoogle && (
                    <button
                      type="button"
                      onClick={() => setScheduleFormat('google_meet')}
                      className={cn(
                        "p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs transition-all cursor-pointer",
                        scheduleFormat === 'google_meet' 
                          ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-600/30" 
                          : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      <Video size={15} className="text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold">Google Meet</div>
                        <div className="text-[10px] text-zinc-500 font-normal">HD Video Room</div>
                      </div>
                    </button>
                  )}

                  {/* Option 2: Microsoft Teams (Only if Microsoft is connected) */}
                  {hasMicrosoft && (
                    <button
                      type="button"
                      onClick={() => setScheduleFormat('teams')}
                      className={cn(
                        "p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs transition-all cursor-pointer",
                        scheduleFormat === 'teams' 
                          ? "border-indigo-600 bg-indigo-50 text-indigo-950 font-semibold ring-1 ring-indigo-600/30" 
                          : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      <Video size={15} className="text-indigo-600 shrink-0" />
                      <div>
                        <div className="font-bold">Microsoft Teams</div>
                        <div className="text-[10px] text-zinc-500 font-normal">Teams Video Call</div>
                      </div>
                    </button>
                  )}

                  {/* Option 3: Phone Interview (Always Available) */}
                  <button
                    type="button"
                    onClick={() => setScheduleFormat('phone')}
                    className={cn(
                      "p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs transition-all cursor-pointer",
                      scheduleFormat === 'phone' 
                        ? "border-blue-600 bg-blue-50 text-blue-950 font-semibold ring-1 ring-blue-600/30" 
                        : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <Phone size={15} className="text-blue-600 shrink-0" />
                    <div>
                      <div className="font-bold">Phone Interview</div>
                      <div className="text-[10px] text-zinc-500 font-normal">Direct Telephone Call</div>
                    </div>
                  </button>

                  {/* Option 4: Physical Interview (Always Available) */}
                  <button
                    type="button"
                    onClick={() => setScheduleFormat('physical')}
                    className={cn(
                      "p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs transition-all cursor-pointer",
                      scheduleFormat === 'physical' 
                        ? "border-amber-600 bg-amber-50 text-amber-950 font-semibold ring-1 ring-amber-600/30" 
                        : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    <MapPin size={15} className="text-amber-600 shrink-0" />
                    <div>
                      <div className="font-bold">Physical Interview</div>
                      <div className="text-[10px] text-zinc-500 font-normal">In-Person / Onsite</div>
                    </div>
                  </button>
                </div>

                {!hasGoogle && !hasMicrosoft && (
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Tip: Connect Google Calendar or Microsoft Teams in Settings to unlock 1-click video meeting rooms.
                  </p>
                )}

                {/* Dedicated Phone Input when Phone Interview is selected */}
                {scheduleFormat === 'phone' && (
                  <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 space-y-1.5 mt-2">
                    <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Phone size={13} className="text-blue-600" />
                      Candidate Phone Number to Dial
                    </label>
                    <Input
                      type="tel"
                      required
                      value={schedulePhone}
                      onChange={(e) => setSchedulePhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="h-8 text-xs bg-white border-blue-300 text-zinc-900"
                    />
                    <p className="text-[10px] text-blue-700">
                      Recruiter will place a direct telephone interview call to this number at the scheduled time.
                    </p>
                  </div>
                )}

                {/* Dedicated Location Input when Physical Interview is selected */}
                {scheduleFormat === 'physical' && (
                  <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 space-y-1.5 mt-2">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <MapPin size={13} className="text-amber-600" />
                      Physical Office Location & Meeting Room
                    </label>
                    <Input
                      type="text"
                      required
                      value={scheduleLocation}
                      onChange={(e) => setScheduleLocation(e.target.value)}
                      placeholder="e.g. Headquarters, 3rd Floor - Conference Room B"
                      className="h-8 text-xs bg-white border-amber-300 text-zinc-900"
                    />
                    <p className="text-[10px] text-amber-800">
                      This physical address and room details will be dispatched to the candidate in their invitation.
                    </p>
                  </div>
                )}

                {/* Video Link Info note */}
                {(scheduleFormat === 'google_meet' || scheduleFormat === 'teams') && (
                  <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80 text-[11px] text-zinc-600 flex items-center gap-2 mt-2">
                    <Video size={13} className="text-zinc-500 shrink-0" />
                    <span>
                      Automatically generates a secure <strong>{scheduleFormat === 'teams' ? 'Microsoft Teams' : 'Google Meet'}</strong> room URL and syncs to calendar.
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleCandidate(null)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isScheduling}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                >
                  <CalendarIcon size={13} />
                  Add to Calendar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TalentPool;
