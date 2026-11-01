"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Edit,
  Play,
  Pause,
  XCircle,
  RotateCcw,
  MapPin,
  DollarSign,
  ChevronDown,
  ArrowRight,
  Loader2,
  FileText
} from 'lucide-react';
import { fetchJobById, subscribeToCandidates, updateJobInSupabase, Candidate } from '@/lib/api';
import { showSuccess, showError } from '@/utils/toast';
import { cn, formatSalary } from '@/lib/utils';

type JobStatus = 'Active' | 'Paused' | 'Closed';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editStatus, setEditStatus] = useState<JobStatus>('Active');
  const [editDescription, setEditDescription] = useState('');
  const [editRequirements, setEditRequirements] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    setLoading(true);
    
    fetchJobById(jobId).then(data => {
      setJob(data);
      if (data) {
        setEditTitle(data.title || '');
        setEditDepartment(data.department || '');
        setEditLocation(data.location || 'Remote');
        setEditSalary(data.salary || '');
        setEditStatus(data.status || 'Active');
        setEditDescription(data.description || '');
        setEditRequirements(data.requirements || '');
      }
      setLoading(false);
    });

    const unsubscribe = subscribeToCandidates((allCandidates) => {
      const jobCandidates = allCandidates.filter(c => c.job_id === jobId);
      setCandidates(jobCandidates);
    });

    return () => unsubscribe();
  }, [jobId]);

  const copyApplicationLink = async () => {
    if (!jobId) return;
    const link = `${window.location.origin}/apply/${jobId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      showSuccess('Public application link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!jobId) return;
    try {
      await updateJobInSupabase(jobId, { status: newStatus });
      setJob((prev: any) => ({ ...prev, status: newStatus }));
      setEditStatus(newStatus);
      showSuccess(`Job status updated to ${newStatus}`);
    } catch {
      showError('Failed to update job status');
    }
  };

  const handleSaveEdit = async () => {
    if (!jobId || !editTitle.trim()) {
      showError('Job title is required');
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        title: editTitle.trim(),
        department: editDepartment.trim(),
        location: editLocation.trim(),
        salary: editSalary.trim() ? formatSalary(editSalary.trim()) : '',
        status: editStatus,
        description: editDescription.trim(),
        requirements: editRequirements.trim(),
      };

      await updateJobInSupabase(jobId, updates);
      setJob((prev: any) => ({ ...prev, ...updates }));
      setIsEditDialogOpen(false);
      showSuccess('Job details updated successfully');
    } catch {
      showError('Failed to update job details');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="text-center text-sm text-zinc-400">
            <Loader2 className="animate-spin text-emerald-600 mx-auto mb-2" size={26} />
            <p>Loading job details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center bg-white rounded-lg border border-zinc-200">
          <Briefcase size={36} className="text-zinc-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-zinc-800">Job Not Found</h2>
          <p className="text-sm text-zinc-500 mt-1">This job opening may have been removed or does not exist.</p>
          <Button onClick={() => navigate('/jobs')} className="mt-4 h-9 text-sm">
            Back to Job Openings
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentStatus: JobStatus = job.status || 'Active';
  const highScoringCount = candidates.filter(c => (c.screening_score || 0) >= 80).length;
  const avgScore = candidates.length > 0 
    ? Math.round(candidates.reduce((sum, c) => sum + (c.screening_score || 0), 0) / candidates.length)
    : 0;

  return (
    <DashboardLayout>
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <Link 
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Job Openings
        </Link>
      </div>

      {/* Top Header Panel */}
      <div className="bg-white border border-zinc-200/90 rounded-xl p-5 mb-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{job.title}</h1>
              <Badge className={cn(
                "rounded-md px-2.5 py-0.5 text-xs font-semibold border",
                currentStatus === 'Active' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                currentStatus === 'Paused' && "bg-amber-50 text-amber-700 border-amber-200",
                currentStatus === 'Closed' && "bg-zinc-100 text-zinc-700 border-zinc-200"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full mr-1.5 inline-block",
                  currentStatus === 'Active' && "bg-emerald-500",
                  currentStatus === 'Paused' && "bg-amber-500",
                  currentStatus === 'Closed' && "bg-zinc-400"
                )} />
                {currentStatus}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-500 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-zinc-600 font-medium">
                <MapPin size={13} className="text-zinc-400" />
                {job.location || 'Remote'}
              </span>
              <span>&bull;</span>
              <span>{job.department || 'General'}</span>
              {job.salary && (
                <>
                  <span>&bull;</span>
                  <span className="text-zinc-700 font-medium">{formatSalary(job.salary)}</span>
                </>
              )}
              <span>&bull;</span>
              <span className="text-zinc-400 text-xs">
                Created {new Date(job.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Manager Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 text-sm font-medium border-zinc-200 gap-1.5">
                  <span>Status: <strong>{currentStatus}</strong></span>
                  <ChevronDown size={13} className="text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-sm w-44">
                <DropdownMenuLabel className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Change Role Status
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('Active')}
                  className="flex items-center gap-2 cursor-pointer py-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Open / Active</span>
                  {currentStatus === 'Active' && <Check size={14} className="ml-auto text-emerald-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('Paused')}
                  className="flex items-center gap-2 cursor-pointer py-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Pause Post</span>
                  {currentStatus === 'Paused' && <Check size={14} className="ml-auto text-amber-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('Closed')}
                  className="flex items-center gap-2 cursor-pointer py-1.5 text-zinc-600"
                >
                  <span className="w-2 h-2 rounded-full bg-zinc-400" />
                  <span>Close Job</span>
                  {currentStatus === 'Closed' && <Check size={14} className="ml-auto text-zinc-600" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Job Details Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="h-9 px-3 text-sm font-medium border-zinc-200 hover:bg-zinc-50 gap-1.5"
            >
              <Edit size={14} />
              <span>Edit Details</span>
            </Button>

            {/* View Candidate Pipeline */}
            <Button
              size="sm"
              onClick={() => navigate(`/talent-pool/${job.id}`)}
              className="h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold gap-1.5 shadow-2xs"
            >
              <Users size={14} />
              <span>Pipeline ({candidates.length})</span>
              <ArrowRight size={13} />
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-zinc-200/90 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Applicants</span>
            <Users size={16} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{candidates.length}</div>
          <p className="text-xs text-zinc-500 mt-0.5">Applied to this opening</p>
        </div>

        <div className="bg-white border border-zinc-200/90 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">High Matches (80%+)</span>
            <UserCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{highScoringCount}</div>
          <p className="text-xs text-zinc-500 mt-0.5">Top-tier AI screenings</p>
        </div>

        <div className="bg-white border border-zinc-200/90 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Match Score</span>
            <TrendingUp size={16} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-900">{avgScore}%</div>
          <p className="text-xs text-zinc-500 mt-0.5">Across all screened profiles</p>
        </div>

        <div className="bg-white border border-zinc-200/90 rounded-lg p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Public Apply Link</span>
            <ExternalLink size={16} className="text-zinc-400" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyApplicationLink}
              className="h-8 text-xs font-semibold flex-1 gap-1"
            >
              {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`${window.location.origin}/apply/${job.id}`, '_blank')}
              className="h-8 text-xs font-semibold px-2.5"
              title="Open public candidate form"
            >
              <ExternalLink size={13} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Description & Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description Card */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Briefcase size={16} className="text-emerald-600" />
                Job Description
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="h-7 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                Edit Content
              </Button>
            </div>
            <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {job.description || (
                <span className="text-zinc-400 italic">No job description provided. Click "Edit Details" to add one.</span>
              )}
            </div>
          </div>

          {/* Screening Requirements Card */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-600" />
                AI Screening Requirements & Qualifications
              </h2>
            </div>
            <div className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap bg-zinc-50 p-4 rounded-lg border border-zinc-100">
              {job.requirements || (
                <span className="text-zinc-400 italic">No screening criteria configured. Click "Edit Details" to specify evaluation requirements.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Role Overview & Recent Applicants */}
        <div className="space-y-6">
          {/* Role Snapshot */}
          <div className="bg-white border border-zinc-200/90 rounded-xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-zinc-900 mb-3 border-b border-zinc-100 pb-2">
              Role Snapshot
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Department</span>
                <span className="font-semibold text-zinc-800">{job.department || 'General'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Location</span>
                <span className="font-semibold text-zinc-800">{job.location || 'Remote'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Compensation</span>
                <span className="font-semibold text-zinc-800">{job.salary ? formatSalary(job.salary) : 'Competitive'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Status</span>
                <span className="font-semibold text-zinc-800">{currentStatus}</span>
              </div>
            </div>
          </div>

          {/* Quick Applicant Pipeline Link */}
          <div className="bg-zinc-900 rounded-xl p-5 text-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Candidate Pipeline</h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                {candidates.length} Applicants
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Open this role's Kanban workspace to review candidate resumes, AI match breakdowns, and update pipeline stages.
            </p>
            <Button
              onClick={() => navigate(`/talent-pool/${job.id}`)}
              className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm gap-1.5"
            >
              <span>Open Candidate Pipeline</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Job Modal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-xl border border-zinc-200">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-zinc-900">Edit Job Post</DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              Update position details, compensation, screening requirements, or change vacancy status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Job Title *</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Senior AI Engineer"
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Department</label>
                <Input
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Location</label>
                <Input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Remote / New York"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Salary / Compensation</label>
                <Input
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  placeholder="e.g. PKR 150,000 - 250,000 / month"
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 block mb-1">Role Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as JobStatus)}
                  className="w-full h-9 px-3 rounded-md border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="Active">Active (Open for applications)</option>
                  <option value="Paused">Paused (Temporarily on hold)</option>
                  <option value="Closed">Closed (Position filled/closed)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">Job Description</label>
              <Textarea
                rows={4}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Provide an overview of responsibilities and scope..."
                className="text-sm leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 block mb-1">AI Screening Requirements & Criteria</label>
              <Textarea
                rows={4}
                value={editRequirements}
                onChange={(e) => setEditRequirements(e.target.value)}
                placeholder="List skills, toolsets, and evaluation criteria for AI screening..."
                className="text-sm leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-zinc-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4"
            >
              {isSaving ? <Loader2 className="animate-spin mr-1.5" size={14} /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default JobDetails;
