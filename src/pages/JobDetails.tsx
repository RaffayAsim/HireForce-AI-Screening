"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Briefcase, 
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Calendar,
  Users,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Loader2,
  Lock
} from 'lucide-react';
import { fetchJobById, subscribeToCandidates } from '@/lib/api';
import { Candidate } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { CsvExport } from '@/components/talent-pool/CsvExport';
import { DeleteJobData } from '@/components/talent-pool/DeleteJobData';
import { useRole } from '@/contexts/RoleContext';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingJob, setClosingJob] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    
    setLoading(true);
    
    fetchJobById(jobId).then(data => {
      setJob(data);
      setLoading(false);
    });

    const unsubscribe = subscribeToCandidates((allCandidates) => {
      const jobCandidates = allCandidates.filter(c => c.job_id === jobId);
      setCandidates(jobCandidates);
    });

    return () => unsubscribe();
  }, [jobId]);

  const jobCandidates = candidates;
  const highScoringCandidates = candidates.filter(c => c.screening_score !== null && c.screening_score >= 80);

  const copyApplicationLink = async () => {
    if (!jobId) return;
    const link = `${window.location.origin}/apply/${jobId}`;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      showSuccess('Application link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleCloseJob = async () => {
    if (!jobId || !isAdmin) return;
    
    setClosingJob(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'Closed' })
        .eq('id', jobId);

      if (error) throw error;

      setJob({ ...job, status: 'Closed' });
      showSuccess('Job has been closed successfully');
      setCloseDialogOpen(false);
    } catch (error) {
      console.error('Error closing job:', error);
      showError('Failed to close job');
    } finally {
      setClosingJob(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
            <p className="text-slate-500 font-medium">Loading job details from Supabase...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Job Not Found</h3>
          <p className="text-slate-500 mb-4">Unable to load job details from Supabase.</p>
          <Button onClick={() => navigate('/jobs')} variant="outline">
            <ArrowLeft size={16} className="mr-2" />
            Back to Jobs
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isClosed = job.status === 'Closed';

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/jobs')}
          className="mb-6 hover:bg-slate-100 rounded-xl gap-2"
        >
          <ArrowLeft size={16} />
          Back to Jobs
        </Button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-emerald-600/10 rounded-[2rem] flex items-center justify-center ring-1 ring-emerald-600/20">
              <Briefcase className="text-emerald-600" size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">{job.title}</h1>
                {isClosed && (
                  <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 rounded-full px-3 py-1 font-bold text-xs">
                    CLOSED
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <Badge className={cn(
                  "rounded-full px-3 py-1 font-bold text-xs",
                  job.status === 'Active' || !job.status ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                  job.status === 'Closed' ? 'bg-slate-500/10 text-slate-600 border-slate-500/20' :
                  job.status === 'Draft' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                  'bg-slate-500/10 text-slate-500 border-slate-500/20'
                )}>
                  {job.status || 'Active'}
                </Badge>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{job.location || job.department}</span>
                <div className="flex items-center gap-1 text-sm font-bold text-slate-500">
                  <Calendar size={14} />
                  {formatDate(job.created_at)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            {!isClosed && isAdmin && (
              <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-12 px-6 rounded-2xl gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    <Lock size={18} />
                    Close Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl bg-white/95 backdrop-blur-2xl p-0 overflow-hidden">
                  <div className="h-2 bg-amber-500" />
                  <div className="p-8">
                    <DialogHeader className="mb-6">
                      <div className="w-16 h-16 bg-amber-100 rounded-[1.5rem] flex items-center justify-center mb-4">
                        <Lock className="text-amber-600" size={32} />
                      </div>
                      <DialogTitle className="text-2xl font-black text-[#0F172A] tracking-tight">
                        Close This Job?
                      </DialogTitle>
                      <DialogDescription className="text-slate-500 text-base mt-2">
                        Closing the job will prevent new applications. You can still access all candidate data.
                        <br /><br />
                        <span className="text-amber-600 font-medium">
                          {candidates.length} candidates will be preserved for your records.
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3">
                      <Button
                        variant="outline"
                        className="h-12 px-6 rounded-2xl font-bold"
                        onClick={() => setCloseDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="h-12 px-6 rounded-2xl font-bold gap-2 bg-amber-500 hover:bg-amber-600"
                        onClick={handleCloseJob}
                        disabled={closingJob}
                      >
                        {closingJob && <Loader2 className="animate-spin" size={18} />}
                        Yes, Close Job
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Button 
              variant="outline" 
              className="h-12 px-6 rounded-2xl gap-2"
              onClick={copyApplicationLink}
            >
              {copiedLink ? <Check size={18} /> : <Copy size={18} />}
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </Button>
            
            {isAdmin && (
              <>
                <CsvExport candidates={candidates} jobTitle={job.title} />
                <DeleteJobData 
                  jobId={jobId!} 
                  candidates={candidates} 
                  onDelete={() => navigate('/jobs')}
                />
              </>
            )}
            
            <Button 
              className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold gap-2"
              onClick={() => window.open(`${window.location.origin}/apply/${job.id}`, '_blank')}
            >
              <ExternalLink size={18} />
              View Application Page
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card rounded-[2rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="text-emerald-600" size={20} />
                  <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Total Applicants</span>
                </div>
                <span className="text-3xl font-black text-emerald-700">{jobCandidates.length}</span>
              </CardContent>
            </Card>
            
            <Card className="glass-card rounded-[2rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <UserCheck className="text-emerald-600" size={20} />
                  <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">High Matches</span>
                </div>
                <span className="text-3xl font-black text-emerald-700">{highScoringCandidates.length}</span>
              </CardContent>
            </Card>
            
            <Card className="glass-card rounded-[2rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="text-emerald-600" size={20} />
                  <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Avg Score</span>
                </div>
                <span className="text-3xl font-black text-emerald-700">
                  {jobCandidates.length > 0 
                    ? Math.round(jobCandidates.reduce((sum, c) => sum + (c.screening_score || 0), 0) / jobCandidates.length)
                    : 0}%
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-6">
              <CardTitle className="text-2xl font-bold text-[#0F172A] flex items-center gap-3">
                <Sparkles className="text-emerald-600" size={24} />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                  {job.description || 'No description available.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {job.requirements && (
            <Card className="glass-card rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8 pb-6">
                <CardTitle className="text-2xl font-bold text-[#0F172A] flex items-center gap-3">
                  <Sparkles className="text-emerald-600" size={24} />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                    {job.requirements}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-8">
          <Card className="bg-[#0F172A] rounded-[2rem] overflow-hidden text-white">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-3">
                <ExternalLink className="text-emerald-400" size={20} />
                Application Link
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="bg-white/10 rounded-xl p-4 font-mono text-sm break-all mb-4">
                {`${window.location.origin}/apply/${job.id}`}
              </div>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold"
                onClick={copyApplicationLink}
              >
                {copiedLink ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </Button>
            </CardContent>
          </Card>

          {isClosed && (
            <Card className="bg-amber-50 rounded-[2rem] overflow-hidden border-amber-200">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-3">
                  <Lock className="text-amber-600" size={20} />
                  Job is Closed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <p className="text-amber-700 text-sm mb-4">
                  This job is no longer accepting applications. Use the export and delete options to manage your data.
                </p>
              </CardContent>
            </Card>
          )}

          {highScoringCandidates.length > 0 && (
            <Card className="glass-card rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-lg font-bold text-[#0F172A] flex items-center gap-3">
                  <TrendingUp className="text-emerald-600" size={20} />
                  Top Candidates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {highScoringCandidates.slice(0, 5).map((candidate) => (
                  <div key={candidate.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-600">{candidate.full_name[0]}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-700">{candidate.full_name}</p>
                        <p className="text-sm text-slate-500">{candidate.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-full px-3 py-1 font-bold text-xs">
                      {candidate.screening_score}% Match
                    </Badge>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl"
                  onClick={() => navigate(`/talent-pool/${jobId}`)}
                >
                  View in Talent Pool
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card rounded-[2rem] overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-bold text-[#0F172A]">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              <Button 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold text-sm"
                onClick={() => navigate(`/talent-pool/${jobId}`)}
              >
                <Users className="mr-2" size={16} />
                Open Talent Pool Workspace
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-2xl font-bold text-sm"
                onClick={() => window.open(`${window.location.origin}/apply/${job.id}`, '_blank')}
              >
                <ExternalLink className="mr-2" size={16} />
                Preview Application Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobDetails;