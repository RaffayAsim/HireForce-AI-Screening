"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateJobModal from '@/components/jobs/CreateJobModal';
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeToJobs, subscribeToCandidates } from '@/lib/api';
import { Candidate, Job } from '@/lib/supabase';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { UpgradeRequestModal } from '@/components/subscription/UpgradeRequestModal';
import { AlertTriangle, Zap as ZapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompactMetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CompactMetricCard = ({ title, value, subtitle, trend, icon: Icon }: CompactMetricCardProps) => (
  <Card className="bg-white border border-zinc-200/90 shadow-sm rounded-lg hover:border-zinc-300 transition-all">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-500">{title}</span>
        <div className="w-7 h-7 rounded bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-600">
          <Icon size={14} className="text-emerald-600" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-zinc-900">{value}</span>
          {trend && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              {trend}
            </span>
          )}
        </div>
      </div>
      <p className="text-[11px] text-zinc-400 mt-1">{subtitle}</p>
    </CardContent>
  </Card>
);

const Index = () => {
  const { isAdmin } = useRole();
  const { user, isTrial, quotaStatus, hasReachedScanLimit, hasReachedJobLimit, getRemainingScans } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribeJobs = subscribeToJobs((updatedJobs) => {
      setJobs(updatedJobs);
      setLoading(false);
    }, user?.id);

    const unsubscribeCandidates = subscribeToCandidates((updatedCandidates) => {
      setCandidates(updatedCandidates);
    }, user?.id);

    return () => {
      unsubscribeJobs();
      unsubscribeCandidates();
    };
  }, [user?.id]);

  // Derived metrics
  const activeJobs = jobs.filter(j => j.status === 'Active' || !j.status).length;
  const totalApplicants = candidates.length;
  const screenedCount = candidates.filter(c => c.screening_score !== null).length;
  const highMatches = candidates.filter(c => c.screening_score !== null && c.screening_score >= 80).length;
  const avgScore = screenedCount > 0 
    ? Math.round(candidates.reduce((acc, c) => acc + (c.screening_score || 0), 0) / screenedCount)
    : 0;

  const recentScreened = candidates
    .filter(c => c.screening_score !== null)
    .slice(0, 5);

  const getJobTitle = (jobId: string) => {
    const found = jobs.find(j => j.id === jobId);
    return found?.title || 'General Position';
  };

  const remainingScans = getRemainingScans ? getRemainingScans() : 0;
  const isScansExhausted = Boolean(
    isTrial && (
      (hasReachedScanLimit && hasReachedScanLimit()) || 
      remainingScans <= 0 ||
      Boolean(quotaStatus?.scansExhausted)
    )
  );
  const isJobsExhausted = Boolean(
    isTrial && (
      (hasReachedJobLimit && hasReachedJobLimit()) ||
      Boolean(quotaStatus?.jobsExhausted)
    )
  );
  const isTrialExhausted = isScansExhausted;
  const totalScans = Math.max(user?.maxScans || 10, 10);
  const usedScans = Math.max(0, totalScans - remainingScans);
  const maxJobs = Math.max(user?.maxJobs || 10, 10);



  return (
    <DashboardLayout>
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium">
              Live Pipeline
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Real-time candidate evaluation, match scoring, and active openings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/talent-pool"
            className="h-8 px-3 rounded-md bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors"
          >
            <Users size={13} />
            View All Candidates
          </Link>
          <CreateJobModal />
        </div>
      </div>

      {/* Trial Status / Soft Pause Banner */}
      {isTrial && (
        <div className={`mb-6 p-4 rounded-xl border transition-all ${
          isTrialExhausted 
            ? "bg-amber-500/10 border-amber-500/30 text-amber-900" 
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-900"
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isTrialExhausted ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
              }`}>
                {isTrialExhausted ? <AlertTriangle size={18} /> : <Sparkles size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-900">
                    {isScansExhausted 
                      ? "Trial Quota Reached — AI Resume Screening & Automations Soft Paused" 
                      : isJobsExhausted
                        ? `Job Limit Reached — ${maxJobs} of ${maxJobs} Job Slots In Use`
                        : `Free Trial Active — ${totalScans} AI Screenings & ${maxJobs} Active Jobs Included`}
                  </h3>
                  <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isScansExhausted 
                      ? "bg-amber-100 text-amber-800 border-amber-300" 
                      : isJobsExhausted
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  }`}>
                    {isScansExhausted ? "Soft Paused" : isJobsExhausted ? "Jobs Full" : `${remainingScans} scans left`}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-600 mt-1 max-w-2xl leading-relaxed">
                  {isScansExhausted
                    ? "You've reached your free trial screening allowance. Your candidate database, resumes, notes, and emails remain fully accessible. Upgrade your plan to re-enable automated AI candidate evaluations and interview automations."
                    : isJobsExhausted
                      ? `You have reached your limit of ${maxJobs} active job postings. AI candidate screening is still fully active (${remainingScans} scans left). Upgrade to Pro for unlimited job postings.`
                      : `You have used ${usedScans} of ${totalScans} AI candidate screenings and ${jobs.length} of ${maxJobs} job slots. Your pipeline and emails are fully active.`}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setUpgradeModalOpen(true)}
              className={`h-9 px-4 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm flex-shrink-0 ${
                isTrialExhausted 
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              }`}
            >
              <ZapIcon size={14} />
              {isTrialExhausted ? "Request Plan Upgrade" : "Upgrade Plan"}
            </Button>
          </div>
        </div>
      )}

      {/* 4 Compact Metric Cards (Concept 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <CompactMetricCard 
          title="Active Job Openings" 
          value={loading ? '...' : activeJobs} 
          subtitle="Open positions receiving applications"
          trend={activeJobs > 0 ? `+${activeJobs} active` : undefined}
          icon={Briefcase} 
        />
        <CompactMetricCard 
          title="Total Candidates" 
          value={loading ? '...' : totalApplicants} 
          subtitle="Candidates in talent pool"
          trend={totalApplicants > 0 ? `+${totalApplicants} total` : undefined}
          icon={Users} 
        />
        <CompactMetricCard 
          title="Screened by AI" 
          value={loading ? '...' : screenedCount} 
          subtitle="Processed through screening webhook"
          trend={screenedCount > 0 ? `${screenedCount} analyzed` : undefined}
          icon={Sparkles} 
        />
        <CompactMetricCard 
          title="Average Match Score" 
          value={loading ? '...' : (avgScore > 0 ? `${avgScore}%` : 'N/A')} 
          subtitle={`${highMatches} high match candidates (80%+)`}
          trend={highMatches > 0 ? `${highMatches} top tier` : undefined}
          icon={TrendingUp} 
        />
      </div>

      {/* Main Grid: AI Candidate Screening Table & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: AI Screening Table (Concept 3 core) */}
        <div className="lg:col-span-2">
          <Card className="bg-white border border-zinc-200/90 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">AI Candidate Screening</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Automated resume evaluation and qualifications matching</p>
              </div>
              <Link 
                to="/talent-pool" 
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Open Full Pipeline
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {recentScreened.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Candidate</th>
                      <th className="py-2.5 px-4">Job Role</th>
                      <th className="py-2.5 px-4">Match %</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {recentScreened.map((c) => {
                      const score = c.screening_score || 0;
                      const isHigh = score >= 80;
                      const isMed = score >= 60 && score < 80;

                      return (
                        <tr key={c.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-3 px-4 font-semibold text-zinc-900">
                            <div>{c.full_name}</div>
                            <div className="text-[11px] font-normal text-zinc-400">{c.email}</div>
                          </td>
                          <td className="py-3 px-4 text-zinc-600">
                            {getJobTitle(c.job_id)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              isHigh 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : isMed 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            }`}>
                              {score}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 capitalize">
                              {c.status || 'Screened'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/talent-pool/${c.job_id || ''}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                            >
                              View <ArrowUpRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-zinc-400 text-xs">
                  <Sparkles size={24} className="mx-auto mb-2 text-zinc-300" />
                  <p className="font-semibold text-zinc-700">No candidates screened yet</p>
                  <p className="mt-1">Candidates who apply through your job links will be evaluated here.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Active Jobs Mini-Panel */}
        <div>
          <Card className="bg-white border border-zinc-200/90 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-900">Active Openings</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Top performing job postings</p>
              </div>
              <Link 
                to="/jobs" 
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Manage
              </Link>
            </div>
            <div className="p-4 space-y-2.5">
              {jobs.slice(0, 4).map((job) => {
                const jobCandidates = candidates.filter(c => c.job_id === job.id);
                return (
                  <Link
                    key={job.id}
                    to={`/talent-pool/${job.id}`}
                    className="block p-3 rounded-md border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-zinc-900 group-hover:text-emerald-600 transition-colors truncate">
                        {job.title}
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        {jobCandidates.length} applicants
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1.5">
                      <span>{job.department || 'General'}</span>
                      <span>•</span>
                      <span>{job.location || 'Remote'}</span>
                    </div>
                  </Link>
                );
              })}
              {jobs.length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-400">
                  No jobs created yet.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      <UpgradeRequestModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} />
    </DashboardLayout>
  );
};

export default Index;
