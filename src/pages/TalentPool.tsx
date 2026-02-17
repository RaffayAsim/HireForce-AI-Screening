"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Briefcase, 
  Users, 
  Sparkles, 
  ChevronRight, 
  Search,
  Loader2,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { subscribeToJobs, subscribeToCandidates, Job, Candidate } from '@/lib/api';

const TalentPool = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const getCandidateCount = (jobId: string) => {
    return candidates.filter((c) => c.job_id === jobId).length;
  };

  const getHighMatchCount = (jobId: string) => {
    return candidates.filter((c) => 
      c.job_id === jobId && 
      c.screening_score !== null && 
      c.screening_score > 75
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

  const filteredJobs = jobs.filter((job) => 
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Talent Pool</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">
            {loading ? 'Loading jobs from Supabase...' : `Managing ${candidates.length} candidates across ${jobs.length} job openings`}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <Input 
              placeholder="Search jobs..." 
              className="pl-12 h-14 w-64 rounded-2xl border-slate-200 bg-white/70 backdrop-blur-md focus-visible:ring-emerald-500/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <div className="text-center">
              <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
              <p className="text-slate-500 font-medium">Loading jobs from Supabase...</p>
            </div>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const candidateCount = getCandidateCount(job.id);
            const highMatchCount = getHighMatchCount(job.id);
            
            return (
              <Card 
                key={job.id} 
                className="glass-card rounded-[2.5rem] overflow-hidden hover:translate-y-[-4px] transition-all duration-500 group cursor-pointer relative"
                onClick={() => navigate(`/talent-pool/${job.id}`)}
              >
                <CardContent className="p-8">
                  {/* Header with Icon */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-emerald-600/10 rounded-[1.5rem] flex items-center justify-center ring-1 ring-emerald-600/20 group-hover:scale-110 transition-transform duration-300">
                      <Briefcase className="text-emerald-600" size={28} />
                    </div>
                    {highMatchCount > 0 && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 rounded-full px-3 py-1.5 font-bold text-xs flex items-center gap-1">
                        <Sparkles size={12} />
                        {highMatchCount} Matches Found
                      </Badge>
                    )}
                  </div>

                  {/* Job Title */}
                  <h3 className="text-2xl font-black text-[#0F172A] tracking-tight mb-2 group-hover:text-emerald-600 transition-colors">
                    {job.title}
                  </h3>
                  
                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-6">
                    <span className="font-bold uppercase tracking-widest">{job.department || job.location || 'Remote'}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{formatDate(job.created_at)}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Users className="text-slate-600" size={18} />
                        </div>
                        <div>
                          <p className="text-xl font-black text-[#0F172A]">{candidateCount}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                        </div>
                      </div>
                      
                      {highMatchCount > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="text-emerald-600" size={18} />
                          </div>
                          <div>
                            <p className="text-xl font-black text-emerald-600">{highMatchCount}</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Top Matches</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                      <ChevronRight className="text-white" size={24} />
                    </div>
                  </div>
                </CardContent>

                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] pointer-events-none" />
              </Card>
            );
          })
        )}

        {!loading && filteredJobs.length === 0 && (
          <div className="col-span-full text-center py-20 glass-card rounded-[3rem]">
            <Briefcase className="mx-auto text-slate-400 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No jobs found</h3>
            <p className="text-slate-500">Create a job opening to start building your talent pool.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TalentPool;