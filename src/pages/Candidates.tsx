"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Filter, ExternalLink, Sparkles, ChevronRight, Loader2, Mail, Linkedin, Calendar, Award, Users, Briefcase } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from '@/components/candidates/StatusBadge';
import { StatusDropdown } from '@/components/candidates/StatusDropdown';
import { JobFunnelBar } from '@/components/candidates/JobFunnelBar';
import { BulkActionsBar } from '@/components/candidates/BulkActionsBar';
import { Candidate, Job } from '@/lib/supabase';
import { subscribeToCandidates, subscribeToJobs } from '@/lib/api';
import { useRole } from '@/contexts/RoleContext';

const Candidates = () => {
  const { isAdmin, isViewer } = useRole();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedJobs, setExpandedJobs] = useState<string[]>([]);

  useEffect(() => {
    setLoading(true);
    
    const unsubscribeCandidates = subscribeToCandidates((updatedCandidates) => {
      setCandidates(updatedCandidates);
      setLoading(false);
    });

    const unsubscribeJobs = subscribeToJobs((updatedJobs) => {
      setJobs(updatedJobs);
    });

    return () => {
      unsubscribeCandidates();
      unsubscribeJobs();
    };
  }, []);

  // Group candidates by job
  const candidatesByJob = useMemo(() => {
    const grouped = new Map<string, Candidate[]>();
    
    // Group by job_id
    candidates.forEach(candidate => {
      const jobId = candidate.job_id || 'general';
      if (!grouped.has(jobId)) {
        grouped.set(jobId, []);
      }
      grouped.get(jobId)?.push(candidate);
    });
    
    return grouped;
  }, [candidates]);

  const getJobTitle = (jobId: string) => {
    if (jobId === 'general') return 'General Applications';
    const job = jobs.find(j => j.id === jobId);
    return job?.title || 'Unknown Position';
  };

  const getJobLocation = (jobId: string) => {
    if (jobId === 'general') return 'Various';
    const job = jobs.find(j => j.id === jobId);
    return job?.location || job?.department || 'Remote';
  };

  const getTopMatches = (jobCandidates: Candidate[]) => {
    return jobCandidates.filter(c => c.screening_score !== null && c.screening_score > 75).length;
  };

  const toggleSelection = (candidateId: string) => {
    setSelectedIds(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobs(prev =>
      prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const filteredCandidates = candidates.filter((c) => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getJobTitle(c.job_id || 'general').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-12">
        <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Talent Pool</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">
          {loading ? 'Loading candidates from Supabase...' : `${candidates?.length || 0} candidates across ${candidatesByJob.size} job openings`}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <Input 
            placeholder="Search candidates by name, role, or email..." 
            className="pl-12 h-14 rounded-2xl border-none shadow-sm bg-white/70 backdrop-blur-md focus-visible:ring-blue-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-14 px-6 rounded-2xl gap-2 bg-white/70 backdrop-blur-md border-none shadow-sm font-bold text-slate-600 hover:bg-white transition-all">
          <Filter size={20} />
          Advanced Filters
        </Button>
      </div>

      {/* Job-Centric Cards */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={40} />
              <p className="text-slate-500 font-medium">Loading candidates from Supabase...</p>
            </div>
          </div>
        ) : (
          Array.from(candidatesByJob.entries()).map(([jobId, jobCandidates]) => (
            <Card key={jobId} className="glass-card rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center ring-1 ring-blue-600/20">
                      <Briefcase className="text-blue-600" size={28} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-[#0F172A] tracking-tight">
                        {getJobTitle(jobId)}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                          {getJobLocation(jobId)}
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                        <span className="text-sm font-bold text-slate-600">
                          {jobCandidates.length} Total
                        </span>
                        <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                        <span className="text-sm font-bold text-emerald-600">
                          {getTopMatches(jobCandidates)} Top Matches ({'>'}75%)
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    className="rounded-2xl font-bold gap-2"
                    onClick={() => toggleJobExpansion(jobId)}
                  >
                    {expandedJobs.includes(jobId) ? 'Collapse' : 'View Candidates'}
                    <ChevronRight 
                      size={16} 
                      className={`transition-transform ${expandedJobs.includes(jobId) ? 'rotate-90' : ''}`} 
                    />
                  </Button>
                </div>
                
                {/* Funnel Bar */}
                <div className="mt-6">
                  <JobFunnelBar candidates={jobCandidates} />
                </div>
              </CardHeader>
              
              <Accordion type="multiple" value={expandedJobs} className="w-full">
                <AccordionItem value={jobId} className="border-none">
                  <AccordionContent className="pb-0">
                    <CardContent className="p-8 pt-0">
                      <div className="space-y-3">
                        {jobCandidates.map((candidate) => (
                          <div 
                            key={candidate.id} 
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-slate-100 hover:bg-white/80 transition-all group"
                          >
                            {isAdmin && (
                              <Checkbox 
                                checked={selectedIds.includes(candidate.id)}
                                onCheckedChange={() => toggleSelection(candidate.id)}
                                className="rounded-lg border-slate-300"
                              />
                            )}
                            
                            <div 
                              className="flex-1 flex items-center gap-4 cursor-pointer"
                              onClick={() => setSelectedCandidate(candidate)}
                            >
                              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.full_name}`} />
                                <AvatarFallback>{candidate.full_name?.[0] || '?'}</AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-[#0F172A]">{candidate.full_name || 'Unknown'}</span>
                                  <StatusBadge status={candidate.status} />
                                </div>
                                <p className="text-sm text-slate-500">{candidate.email}</p>
                              </div>
                              
                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <div className="text-lg font-black text-[#0F172A]">
                                    {candidate.screening_score !== null ? `${candidate.screening_score}%` : '...'}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Match</div>
                                </div>
                                
                                <div className="text-right min-w-[100px]">
                                  <div className="text-sm font-medium text-slate-600">
                                    {formatDate(candidate.created_at)}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Applied</div>
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl font-bold gap-2"
                              onClick={() => setSelectedCandidate(candidate)}
                            >
                              View <ChevronRight size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          ))
        )}
        
        {!loading && candidates.length === 0 && (
          <div className="text-center py-20 glass-card rounded-[3rem]">
            <Users className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No candidates found</h3>
            <p className="text-slate-500">Candidates will appear here once they apply.</p>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {isAdmin && (
        <BulkActionsBar 
          selectedIds={selectedIds}
          onClearSelection={() => setSelectedIds([])}
          onActionComplete={() => setSelectedIds([])}
        />
      )}

      {/* Candidate Detail Sheet */}
      <Sheet open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
        <SheetContent className="sm:max-w-[700px] rounded-l-[3rem] border-none shadow-2xl bg-white/95 backdrop-blur-2xl p-0 overflow-y-auto">
          {selectedCandidate && (
            <div className="flex flex-col h-full">
              <div className="p-12 pb-8">
                <SheetHeader className="mb-10">
                  <div className="flex items-center gap-6 mb-8">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCandidate.full_name}`} />
                      <AvatarFallback className="text-2xl">{selectedCandidate.full_name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className="text-3xl font-black text-[#0F172A] tracking-tight">
                        {selectedCandidate.full_name || 'Unknown Candidate'}
                      </SheetTitle>
                      <SheetDescription className="text-blue-600 font-bold text-lg mt-1">
                        {getJobTitle(selectedCandidate.job_id || 'general')}
                      </SheetDescription>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    {isAdmin ? (
                      <>
                        <Button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20">
                          Schedule Interview
                        </Button>
                        <StatusDropdown 
                          candidate={selectedCandidate} 
                          onStatusChange={(newStatus) => {
                            setSelectedCandidate({...selectedCandidate, status: newStatus});
                          }}
                        />
                      </>
                    ) : (
                      <Button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20">
                        View Details
                      </Button>
                    )}
                  </div>
                </SheetHeader>

                <div className="space-y-10">
                  {/* AI Screening Summary */}
                  <div className="p-8 bg-[#0F172A] rounded-[2.5rem] shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="text-blue-400" size={24} />
                        <h3 className="font-bold text-white text-xl">AI Screening Summary</h3>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-4">
                        <StatusBadge status={selectedCandidate.status} />
                        <span className="text-2xl font-black text-white">
                          {selectedCandidate.screening_score !== null ? `${selectedCandidate.screening_score}%` : 'Analyzing...'}
                        </span>
                      </div>

                      {selectedCandidate.screening_summary ? (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <p className="text-slate-300 leading-relaxed text-base whitespace-pre-wrap">
                            {selectedCandidate.screening_summary}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400 leading-relaxed text-lg">
                          {selectedCandidate.screening_score !== null 
                            ? 'AI analysis complete. Detailed summary not available.'
                            : 'AI analysis in progress... Results will appear when n8n completes processing.'}
                        </p>
                      )}
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
                  </div>

                  {/* Resume */}
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-xl mb-6 tracking-tight">Resume</h3>
                    {selectedCandidate.resume_url ? (
                      <a 
                        href={selectedCandidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        <Award className="text-blue-600" size={24} />
                        <div>
                          <p className="font-bold text-blue-700">View Resume PDF</p>
                          <p className="text-sm text-blue-600">Stored in Supabase Storage</p>
                        </div>
                        <ExternalLink className="text-blue-600 ml-auto" size={18} />
                      </a>
                    ) : (
                      <p className="text-slate-500">No resume uploaded</p>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-xl mb-6 tracking-tight">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <Mail className="text-slate-400" size={18} />
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Email</span>
                        </div>
                        {selectedCandidate.email ? (
                          <a 
                            href={`mailto:${selectedCandidate.email}`}
                            className="font-bold text-slate-700 hover:text-blue-600 transition-colors"
                          >
                            {selectedCandidate.email}
                          </a>
                        ) : (
                          <span className="text-slate-400">No email provided</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                          <Linkedin className="text-slate-400" size={18} />
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">LinkedIn</span>
                        </div>
                        {selectedCandidate.linkedin ? (
                          <a 
                            href={selectedCandidate.linkedin.startsWith('http') ? selectedCandidate.linkedin : `https://${selectedCandidate.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2"
                          >
                            View Profile <ExternalLink size={14} />
                          </a>
                        ) : (
                          <span className="text-slate-400">No LinkedIn provided</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Application Timeline */}
                  <div className="pb-12">
                    <h3 className="font-bold text-[#0F172A] text-xl mb-6 tracking-tight">Application Timeline</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        <div>
                          <p className="font-bold text-slate-700">Application Submitted</p>
                          <p className="text-sm text-slate-500">{formatDate(selectedCandidate.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className={`w-3 h-3 rounded-full ${selectedCandidate.screening_score !== null ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'}`}></div>
                        <div>
                          <p className="font-bold text-slate-700">
                            {selectedCandidate.screening_score !== null ? 'AI Analysis Complete' : 'AI Analysis in Progress'}
                          </p>
                          <p className="text-sm text-slate-500">
                            Score: {selectedCandidate.screening_score !== null ? `${selectedCandidate.screening_score}%` : 'Pending'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 opacity-60">
                        <div className="w-3 h-3 bg-slate-300 rounded-full"></div>
                        <div>
                          <p className="font-bold text-slate-500">Human Review</p>
                          <p className="text-sm text-slate-400">
                            {selectedCandidate.status === 'good' ? 'Marked as Good Fit' : 
                             selectedCandidate.status === 'rejected' ? 'Rejected' :
                             selectedCandidate.status === 'hired' ? 'Hired' : 'Awaiting action'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default Candidates;