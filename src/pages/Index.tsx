"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateJobModal from '@/components/jobs/CreateJobModal';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { RecruitmentFunnel } from '@/components/dashboard/RecruitmentFunnel';
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  Sparkles,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeToJobs, subscribeToCandidates } from '@/lib/api';
import { Candidate, Job } from '@/lib/supabase';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <Card className="glass-card rounded-2xl md:rounded-[2.5rem] overflow-hidden group hover:translate-y-[-4px] transition-all duration-500">
    <CardContent className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <div className={`p-3 md:p-4 rounded-xl md:rounded-[1.5rem] ${color} bg-opacity-10 ring-1 ring-inset ${color.replace('bg-', 'ring-')}/20`}>
          <Icon className={color.replace('bg-', 'text-')} size={20} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
            <ArrowUpRight size={14} />
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 text-xs md:text-sm font-semibold tracking-wide uppercase">{title}</p>
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#0F172A] mt-2 tracking-tight">{value}</h3>
      </div>
    </CardContent>
  </Card>
);

const Index = () => {
  const { isAdmin, isViewer } = useRole();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time subscriptions
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
  }, []);

  // Calculate stats
  const activeJobs = jobs.filter(j => j.status === 'Active' || !j.status).length;
  const totalApplicants = candidates.length;
  const highMatchCount = candidates.filter(c => c.screening_score !== null && c.screening_score >= 80).length;
  const aiEfficiency = totalApplicants > 0 
    ? Math.round((candidates.filter(c => c.screening_score !== null).length / totalApplicants) * 100) 
    : 0;

  // Recent candidates - last 3 screened
  const recentCandidates = candidates
    .filter(c => c.screening_score !== null)
    .slice(0, 3);

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-full px-3 py-1 font-bold text-[9px] md:text-[10px] uppercase tracking-widest">
              {loading ? 'Loading...' : 'Connected to Supabase'}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#0F172A] tracking-tight">Executive Overview</h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base font-medium">The Smart Way to Build Your Team.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar size={20} />
          </button>
          {isAdmin && <CreateJobModal />}
        </div>
      </div>

      {/* Action Center - Needs Your Attention */}
      <div className="mb-8">
        <ActionCenter candidates={candidates} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-8 md:mb-12">
        <StatCard 
          title="Active Positions" 
          value={loading ? '...' : activeJobs} 
          icon={Briefcase} 
          color="bg-emerald-600" 
        />
        <StatCard 
          title="Total Applicants" 
          value={loading ? '...' : totalApplicants} 
          icon={Users} 
          trend={highMatchCount > 0 ? `+${highMatchCount} high matches` : undefined}
          color="bg-emerald-600" 
        />
        <StatCard 
          title="AI Efficiency" 
          value={loading ? '...' : `${aiEfficiency}%`} 
          icon={TrendingUp} 
          color="bg-emerald-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        <div className="lg:col-span-2 glass-card rounded-2xl md:rounded-[3rem] p-4 md:p-6 lg:p-10">
          <div className="flex justify-between items-start md:items-center mb-6 md:mb-10 flex-col md:flex-row gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#0F172A]">Real-time Activity</h2>
              <p className="text-slate-500 text-xs md:text-sm mt-1">Live updates from your active pipelines</p>
            </div>
            <button className="flex items-center gap-2 text-emerald-600 text-sm font-bold hover:gap-3 transition-all">
              View Full Audit <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="space-y-8">
            {recentCandidates.length > 0 ? (
              recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex gap-5 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 ring-1 ring-slate-200 group-hover:scale-110 transition-transform duration-300">
                      <Clock size={22} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-base text-slate-900 font-bold">
                        {candidate.full_name} <span className="font-medium text-slate-400 mx-1">applied for</span> <span className="text-emerald-600">position</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-wider">
                        {candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#0F172A]">{candidate.screening_score}%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Match</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 font-medium">No screened candidates yet. Applications will appear here when n8n completes processing.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <RecruitmentFunnel candidates={candidates} />
          
          <div className="bg-[#0F172A] rounded-[3rem] p-10 shadow-2xl text-white relative overflow-hidden flex flex-col justify-between min-h-[200px]">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-emerald-500/30">
                <Sparkles className="text-emerald-400" size={24} />
              </div>
              <h2 className="text-3xl font-bold mb-4 leading-tight">AI Talent Insights</h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                {highMatchCount > 0 
                  ? `You have ${highMatchCount} high-match candidates waiting for review.`
                  : 'Candidates will appear here after n8n AI screening is complete.'}
              </p>
            </div>
            
            <div className="relative z-10 mt-8">
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-5 rounded-2xl font-bold shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                {highMatchCount > 0 ? 'Review Candidates' : 'View Candidates'}
              </button>
            </div>
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] -ml-32 -mb-32" />
            <Sparkles className="absolute right-[-40px] bottom-[-40px] text-white/5 w-80 h-80 rotate-12" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;