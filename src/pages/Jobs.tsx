"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateJobModal from '@/components/jobs/CreateJobModal';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Users, 
  Link as LinkIcon, 
  Briefcase, 
  Loader2, 
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Clock
} from 'lucide-react';
import { subscribeToJobs, subscribeToCandidates } from '@/lib/api';
import { Job, Candidate } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Real-time subscription
  useEffect(() => {
    setLoading(true);
    
    const unsubscribeJobs = subscribeToJobs((updatedJobs) => {
      setJobs(updatedJobs);
      setLoading(false);
    });

    const unsubscribeCandidates = subscribeToCandidates((updatedCandidates) => {
      setCandidates(updatedCandidates);
    });

    return () => {
      unsubscribeJobs();
      unsubscribeCandidates();
    };
  }, []);

  const handleJobClick = (job: Job) => {
    navigate(`/jobs/${job.id}`);
  };

  const copyApplicationLink = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/apply/${jobId}`;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(jobId);
      showSuccess('Application link copied to clipboard!');
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const openApplicationPage = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`${window.location.origin}/apply/${jobId}`, '_blank');
  };

  const getCandidateCount = (jobId: string) => {
    return candidates.filter((candidate) => candidate.job_id === jobId).length;
  };

  const getHighScoringCandidates = (jobId: string) => {
    return candidates.filter((candidate) => 
      candidate.job_id === jobId && 
      candidate.screening_score !== null && 
      candidate.screening_score >= 80
    ).length;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Job Management</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">
            {loading ? 'Loading jobs from Supabase...' : `Managing ${jobs?.length || 0} active job openings`}
          </p>
        </div>
        <CreateJobModal />
      </div>

      <div className="grid grid-cols-1 gap-6 relative">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
              <p className="text-slate-500 font-medium">Loading jobs from Supabase...</p>
            </div>
          </div>
        )}
        
        {!loading && jobs.map((job) => {
          const candidateCount = getCandidateCount(job.id);
          const highScoringCount = getHighScoringCandidates(job.id);
          
          return (
            <Card key={job.id} className="glass-card rounded-[2.5rem] overflow-hidden hover:translate-y-[-4px] transition-all duration-500 group cursor-pointer" onClick={() => handleJobClick(job)}>
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className="w-16 h-16 bg-emerald-600/10 rounded-[1.5rem] flex items-center justify-center ring-1 ring-emerald-600/20 group-hover:scale-110 transition-transform duration-300">
                    <Briefcase className="text-emerald-600" size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">{job.title}</h3>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{job.location || job.department}</span>
                      <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        <Users size={16} className="text-slate-400" />
                        {candidateCount} {candidateCount === 1 ? 'Applicant' : 'Applicants'}
                      </div>
                      {candidateCount > 0 && (
                        <>
                          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                          <div className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                            {highScoringCount} High Matches
                          </div>
                        </>
                      )}
                      <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                      <div className="flex items-center gap-1 text-sm font-bold text-slate-500">
                        <Clock size={14} />
                        {formatDate(job.created_at)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <Badge className={cn(
                    "rounded-full px-4 py-1.5 font-bold text-[10px] uppercase tracking-widest border-none",
                    job.status === 'Active' || !job.status ? 'bg-emerald-500/10 text-emerald-600' : 
                    job.status === 'Draft' ? 'bg-amber-500/10 text-amber-600' : 
                    'bg-slate-500/10 text-slate-500'
                  )}>
                    {job.status || 'Active'}
                  </Badge>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="w-12 h-12 rounded-2xl border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all" 
                      title="Copy Application Link"
                      onClick={(e) => copyApplicationLink(job.id, e)}
                    >
                      {copiedLink === job.id ? <Check size={20} /> : <LinkIcon size={20} />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="w-12 h-12 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all"
                      title="View Application Page"
                      onClick={(e) => openApplicationPage(job.id, e)}
                    >
                      <ExternalLink size={20} />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="w-12 h-12 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all"
                      title="More Options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal size={20} />
                    </Button>
                  </div>
                </div>
              </CardContent>
              
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]" />
              <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="text-emerald-600" size={24} />
              </div>
            </Card>
          );
        })}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-20 glass-card rounded-[3rem]">
            <Briefcase className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No jobs found</h3>
            <p className="text-slate-500 mb-6">Create your first job opening to get started with AI-powered recruitment.</p>
            <CreateJobModal />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Jobs;