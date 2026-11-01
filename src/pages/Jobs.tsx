"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateJobModal from '@/components/jobs/CreateJobModal';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Link as LinkIcon, 
  Briefcase, 
  Loader2, 
  Copy,
  Check,
  ExternalLink,
  Clock,
  Search,
  ArrowRight,
  MapPin,
  DollarSign,
  Plus
} from 'lucide-react';
import { subscribeToJobs, subscribeToCandidates } from '@/lib/api';
import { Job, Candidate } from '@/lib/supabase';
import { cn, formatSalary } from '@/lib/utils';
import { showSuccess } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';

const Jobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
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

  const handleJobClick = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
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

  const filteredJobs = jobs.filter(job => {
    const q = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      (job.department && job.department.toLowerCase().includes(q)) ||
      (job.location && job.location.toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Job Openings</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Create roles, distribute public application links, and monitor applicant pipelines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CreateJobModal />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, department, location..."
            className="h-9 pl-9 text-sm rounded-md bg-white border-zinc-200 focus-visible:ring-emerald-500"
          />
        </div>
        <div className="text-sm text-zinc-500">
          Showing <span className="font-semibold text-zinc-800">{filteredJobs.length}</span> of {jobs.length} roles
        </div>
      </div>

      {/* Jobs Listing */}
      <div className="space-y-3">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="text-center text-xs text-zinc-400">
              <Loader2 className="animate-spin text-emerald-600 mx-auto mb-2" size={24} />
              <p>Loading jobs from Supabase...</p>
            </div>
          </div>
        )}
        
        {!loading && filteredJobs.map((job) => {
          const candidateCount = getCandidateCount(job.id);
          const highScoringCount = getHighScoringCandidates(job.id);
          const isActive = job.status === 'Active' || !job.status;
          
          return (
            <Card 
              key={job.id} 
              className="bg-white border border-zinc-200/90 shadow-sm rounded-lg hover:border-zinc-300 hover:shadow transition-all group cursor-pointer"
              onClick={() => handleJobClick(job.id)}
            >
              <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-md bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Briefcase size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors truncate">
                        {job.title}
                      </h3>
                      <Badge className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-semibold border",
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                      )}>
                        {job.status || 'Active'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm text-zinc-500">
                      <span className="flex items-center gap-1 text-zinc-600 font-medium">
                        <MapPin size={12} className="text-zinc-400" />
                        {job.location || 'Remote'}
                      </span>
                      <span>•</span>
                      <span>{job.department || 'General'}</span>
                      {job.salary && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-600">{formatSalary(job.salary)}</span>
                        </>
                      )}
                      <span>•</span>
                      <div className="flex items-center gap-1 font-semibold text-zinc-700">
                        <Users size={12} className="text-zinc-400" />
                        {candidateCount} {candidateCount === 1 ? 'applicant' : 'applicants'}
                      </div>
                      {candidateCount > 0 && highScoringCount > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {highScoringCount} top matches
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-2.5 rounded-md border-zinc-200 text-xs font-semibold hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all gap-1.5" 
                    title="Copy Application Link"
                    onClick={(e) => copyApplicationLink(job.id, e)}
                  >
                    {copiedLink === job.id ? <Check size={13} className="text-emerald-600" /> : <LinkIcon size={13} />}
                    <span>{copiedLink === job.id ? 'Copied' : 'Copy Link'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-2.5 rounded-md border-zinc-200 text-xs font-semibold hover:bg-zinc-50 gap-1.5"
                    title="Preview Public Application Form"
                    onClick={(e) => openApplicationPage(job.id, e)}
                  >
                    <ExternalLink size={13} />
                    <span>Apply Page</span>
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm gap-1"
                    onClick={() => handleJobClick(job.id)}
                  >
                    <span>Manage Job</span>
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!loading && filteredJobs.length === 0 && (
          <div className="bg-white border border-zinc-200/90 rounded-xl p-12 text-center flex flex-col items-center justify-center shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-3.5 shadow-2xs">
              <Briefcase size={22} />
            </div>
            <h3 className="text-base font-bold text-zinc-900">No Job Openings Found</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-5 max-w-sm">
              {searchQuery ? "Try refining your search filter query." : "Post your first opening to start receiving and screening resumes."}
            </p>
            <Button
              onClick={() => {
                window.dispatchEvent(new Event('open_create_job'));
              }}
              className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Create New Job</span>
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Jobs;
