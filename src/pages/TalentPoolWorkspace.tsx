"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Briefcase, 
  Search, 
  Users, 
  Sparkles,
  Loader2,
  LayoutGrid,
  List,
  Filter,
  Phone,
  ThumbsUp, 
  Clock, 
  ThumbsDown, 
  Check,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { fetchJobById, subscribeToCandidates, Candidate } from '@/lib/api';
import { CandidateCard } from '@/components/talent-pool/CandidateCard';
import { CsvExport } from '@/components/talent-pool/CsvExport';
import { DeleteJobData } from '@/components/talent-pool/DeleteJobData';
import { useRole } from '@/contexts/RoleContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from '@/components/candidates/StatusBadge';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

type CandidateStatus = 'new' | 'good' | 'waiting' | 'rejected' | 'hired';

const statusConfig = {
  new: { 
    label: 'New',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  good: { 
    label: 'Good Fit',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  waiting: { 
    label: 'Waiting',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  rejected: { 
    label: 'Rejected',
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    lightBg: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  hired: { 
    label: 'Hired',
    color: 'text-purple-600',
    bgColor: 'bg-purple-600',
    lightBg: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
};

const statusOptions: { value: CandidateStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'new', label: 'New', color: 'text-emerald-600', icon: <Clock size={16} /> },
  { value: 'good', label: 'Good Fit', color: 'text-emerald-600', icon: <ThumbsUp size={16} /> },
  { value: 'waiting', label: 'Waiting List', color: 'text-amber-600', icon: <Clock size={16} /> },
  { value: 'rejected', label: 'Rejected', color: 'text-red-600', icon: <ThumbsDown size={16} /> },
  { value: 'hired', label: 'Hired', color: 'text-purple-600', icon: <Check size={16} /> },
];

const TalentPoolWorkspace = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<CandidateStatus>('new');
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    
    setLoading(true);
    
    fetchJobById(jobId).then(data => {
      setJob(data);
    });

    const unsubscribe = subscribeToCandidates((allCandidates) => {
      const jobCandidates = allCandidates.filter(c => c.job_id === jobId);
      setCandidates(jobCandidates);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jobId]);

  // Filter candidates by status and search query
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      // Status filter
      const matchesStatus = candidate.status === activeTab || 
        (activeTab === 'new' && (!candidate.status || candidate.status === 'new'));
      
      // Search filter
      const matchesSearch = 
        candidate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (candidate.screening_score?.toString() || '').includes(searchQuery);
      
      return matchesStatus && matchesSearch;
    });
  }, [candidates, activeTab, searchQuery]);

  const candidatesByStatus = useMemo(() => {
    return {
      new: candidates.filter(c => !c.status || c.status === 'new').length,
      good: candidates.filter(c => c.status === 'good').length,
      waiting: candidates.filter(c => c.status === 'waiting').length,
      rejected: candidates.filter(c => c.status === 'rejected').length,
      hired: candidates.filter(c => c.status === 'hired').length,
    };
  }, [candidates]);

  const handleStatusChange = (candidateId: string, newStatus: CandidateStatus) => {
    setCandidates(prev => prev.map(c => 
      c.id === candidateId ? { ...c, status: newStatus } : c
    ));
    if (selectedCandidate?.id === candidateId) {
      setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleDetailStatusUpdate = async (newStatus: CandidateStatus) => {
    if (!selectedCandidate || statusLoading || newStatus === selectedCandidate.status) return;
    
    setStatusLoading(true);
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', selectedCandidate.id);

      if (error) throw error;

      showSuccess(`${selectedCandidate.full_name} moved to ${statusConfig[newStatus].label}`);
      handleStatusChange(selectedCandidate.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
            <p className="text-slate-500 font-medium">Loading workspace...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/talent-pool')}
          className="mb-6 hover:bg-slate-100 rounded-xl gap-2 font-bold"
        >
          <ArrowLeft size={16} />
          Back to Talent Pool
        </Button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-emerald-600/10 rounded-[2rem] flex items-center justify-center ring-1 ring-emerald-600/20">
              <Briefcase className="text-emerald-600" size={36} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">{job?.title || 'Job Workspace'}</h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {job?.department || job?.location || 'Remote'}
                </span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Users size={16} />
                  {candidates.length} Total Candidates
                </div>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                  <Sparkles size={16} />
                  {candidates.filter(c => c.screening_score !== null && c.screening_score > 75).length} High Matches
                </div>
              </div>
            </div>
          </div>
          
          {isAdmin && (
            <div className="flex gap-3">
              <CsvExport candidates={candidates} jobTitle={job?.title || 'Job'} />
              <DeleteJobData 
                jobId={jobId!} 
                candidates={candidates} 
                onDelete={() => {
                  // Refresh will happen via subscription
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <Input 
            placeholder="Search by name, email, phone, or AI score..." 
            className="pl-12 h-14 rounded-2xl border-slate-200 bg-white/70 backdrop-blur-md focus-visible:ring-emerald-500/20 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CandidateStatus)} className="w-full">
        <TabsList className="bg-white/50 p-2 rounded-2xl h-auto flex flex-wrap gap-2 mb-8">
          <TabsTrigger 
            value="new" 
            className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
          >
            <span className="flex items-center gap-2">
              New
              <Badge className="bg-slate-200 text-slate-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {candidatesByStatus.new}
              </Badge>
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="good" 
            className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
          >
            <span className="flex items-center gap-2">
              Good Fit
              <Badge className="bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {candidatesByStatus.good}
              </Badge>
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="waiting" 
            className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all"
          >
            <span className="flex items-center gap-2">
              Waiting
              <Badge className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {candidatesByStatus.waiting}
              </Badge>
            </span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="rejected" 
            className="rounded-xl px-6 py-3 font-bold data-[state=active]:bg-red-500 data-[state=active]:text-white transition-all"
          >
            <span className="flex items-center gap-2">
              Rejected
              <Badge className="bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {candidatesByStatus.rejected}
              </Badge>
            </span>
          </TabsTrigger>
        </TabsList>

        {(['new', 'good', 'waiting', 'rejected'] as CandidateStatus[]).map((status) => (
          <TabsContent key={status} value={status} className="mt-0">
            {filteredCandidates.length === 0 ? (
              <div className="text-center py-20 glass-card rounded-[3rem]">
                <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
                  <Filter className="text-slate-400" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No candidates found</h3>
                <p className="text-slate-500">
                  {searchQuery ? 'Try adjusting your search query' : `No ${status} candidates in this category`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onStatusChange={(newStatus) => handleStatusChange(candidate.id, newStatus)}
                    onClick={() => setSelectedCandidate(candidate)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Sheet open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <SheetContent className="sm:max-w-[600px] rounded-l-[3rem] border-none shadow-2xl bg-white/95 backdrop-blur-2xl p-0 overflow-y-auto">
          {selectedCandidate && (
            <div className="flex flex-col h-full">
              <div className="p-10 pb-8">
                <SheetHeader className="mb-8">
                  <div className="flex items-center gap-6 mb-6">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCandidate.full_name}`} />
                      <AvatarFallback className="text-2xl font-bold bg-slate-200">
                        {selectedCandidate.full_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <SheetTitle className="text-3xl font-black text-[#0F172A] tracking-tight">
                        {selectedCandidate.full_name || 'Unknown Candidate'}
                      </SheetTitle>
                      <SheetDescription className="text-slate-500 font-medium text-base mt-1">
                        {selectedCandidate.email}
                      </SheetDescription>
                      
                      <div className="mt-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              className={cn(
                                "rounded-xl font-bold text-sm gap-2 border-2 transition-all h-11 px-4",
                                statusConfig[(selectedCandidate.status || 'new') as CandidateStatus].borderColor,
                                statusConfig[(selectedCandidate.status || 'new') as CandidateStatus].lightBg,
                                statusConfig[(selectedCandidate.status || 'new') as CandidateStatus].color
                              )}
                              disabled={statusLoading}
                            >
                              <span className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                statusConfig[(selectedCandidate.status || 'new') as CandidateStatus].bgColor
                              )} />
                              {statusConfig[(selectedCandidate.status || 'new') as CandidateStatus].label}
                              <ChevronDown size={14} className="ml-2" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="rounded-xl w-52">
                            {statusOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleDetailStatusUpdate(option.value)}
                                className={cn(
                                  "rounded-lg cursor-pointer gap-3 py-2.5",
                                  selectedCandidate.status === option.value && "bg-slate-100"
                                )}
                              >
                                <span className={option.color}>{option.icon}</span>
                                <span className={cn("font-semibold", option.color)}>{option.label}</span>
                                {selectedCandidate.status === option.value && <Check size={16} className="ml-auto text-slate-600" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <div className="space-y-8">
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] border border-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="text-emerald-600" size={24} />
                        <h3 className="font-bold text-[#0F172A] text-xl">AI Screening Score</h3>
                      </div>
                      <span className="text-4xl font-black text-emerald-600">
                        {selectedCandidate.screening_score !== null ? `${selectedCandidate.screening_score}%` : 'N/A'}
                      </span>
                    </div>
                    {selectedCandidate.screening_summary && (
                      <div className="p-4 bg-white rounded-2xl border border-emerald-100">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {selectedCandidate.screening_summary}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      onClick={() => handleDetailStatusUpdate('good')}
                      disabled={statusLoading || selectedCandidate.status === 'good'}
                      className={cn(
                        "h-14 rounded-2xl font-bold gap-2 transition-all",
                        selectedCandidate.status === 'good'
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-2 border-emerald-200"
                      )}
                    >
                      <ThumbsUp size={18} />
                      Good Fit
                    </Button>
                    <Button
                      onClick={() => handleDetailStatusUpdate('waiting')}
                      disabled={statusLoading || selectedCandidate.status === 'waiting'}
                      className={cn(
                        "h-14 rounded-2xl font-bold gap-2 transition-all",
                        selectedCandidate.status === 'waiting'
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200 border-2 border-amber-200"
                      )}
                    >
                      <Clock size={18} />
                      Waiting
                    </Button>
                    <Button
                      onClick={() => handleDetailStatusUpdate('rejected')}
                      disabled={statusLoading || selectedCandidate.status === 'rejected'}
                      className={cn(
                        "h-14 rounded-2xl font-bold gap-2 transition-all",
                        selectedCandidate.status === 'rejected'
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-200"
                      )}
                    >
                      <ThumbsDown size={18} />
                      Reject
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#0F172A] text-lg mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Email</span>
                        <span className="font-medium text-slate-700">{selectedCandidate.email}</span>
                      </div>
                      {selectedCandidate.phone && (
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Phone</span>
                          </div>
                          <span className="font-medium text-slate-700">{selectedCandidate.phone}</span>
                        </div>
                      )}
                      {selectedCandidate.linkedin && (
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">LinkedIn</span>
                          <a 
                            href={selectedCandidate.linkedin.startsWith('http') ? selectedCandidate.linkedin : `https://${selectedCandidate.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-emerald-600 hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedCandidate.resume_url && (
                    <div>
                      <h3 className="font-bold text-[#0F172A] text-lg mb-4">Resume</h3>
                      <Button 
                        variant="outline" 
                        className="w-full h-14 rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2 font-bold"
                        onClick={() => window.open(selectedCandidate.resume_url, '_blank')}
                      >
                        <ExternalLink size={18} />
                        View Resume
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default TalentPoolWorkspace;