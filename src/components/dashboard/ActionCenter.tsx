"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Candidate } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface ActionCenterProps {
  candidates: Candidate[];
}

export const ActionCenter = ({ candidates }: ActionCenterProps) => {
  const navigate = useNavigate();

  // Candidates needing attention: status='new' AND screening_score > 75
  const highMatchNewCandidates = candidates.filter(c => 
    c.status === 'new' && 
    c.screening_score !== null && 
    c.screening_score > 75
  );

  // Candidates who applied > 48 hours ago with no status update (still 'new' or undefined)
  const staleCandidates = candidates.filter(c => {
    if (!c.created_at) return false;
    if (c.status && c.status !== 'new') return false;
    const appliedDate = new Date(c.created_at);
    const hoursSinceApplied = (Date.now() - appliedDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceApplied > 48;
  });

  const totalAttentionNeeded = highMatchNewCandidates.length + staleCandidates.length;

  if (totalAttentionNeeded === 0) {
    return (
      <Card className="glass-card rounded-[2.5rem] overflow-hidden bg-emerald-50/50 border-emerald-200/50">
        <CardContent className="p-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Sparkles className="text-emerald-600" size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-800">All Caught Up!</h3>
              <p className="text-emerald-600 font-medium">No candidates need your attention right now.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card rounded-[2.5rem] overflow-hidden border-amber-200/50 bg-amber-50/30">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center ring-1 ring-amber-500/20">
              <AlertCircle className="text-amber-600" size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">Needs Your Attention</h3>
              <p className="text-slate-500 font-medium">{totalAttentionNeeded} candidates require action</p>
            </div>
          </div>
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 rounded-full px-4 py-2 font-bold text-sm">
            {totalAttentionNeeded} Pending
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highMatchNewCandidates.length > 0 && (
            <div 
              className="p-5 bg-white/70 rounded-2xl border border-emerald-200/50 hover:bg-white/90 transition-all cursor-pointer group"
              onClick={() => navigate('/candidates')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Users className="text-emerald-600" size={20} />
                  </div>
                  <span className="font-bold text-[#0F172A]">High Match Candidates</span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 rounded-full font-bold">
                  {highMatchNewCandidates.length}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mb-3">{"Candidates with >75% match score awaiting review"}</p>
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm group-hover:gap-3 transition-all">
                Review Now <ArrowRight size={16} />
              </div>
            </div>
          )}

          {staleCandidates.length > 0 && (
            <div 
              className="p-5 bg-white/70 rounded-2xl border border-amber-200/50 hover:bg-white/90 transition-all cursor-pointer group"
              onClick={() => navigate('/candidates')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Clock className="text-amber-600" size={20} />
                  </div>
                  <span className="font-bold text-[#0F172A]">Stale Applications</span>
                </div>
                <Badge className="bg-amber-500/10 text-amber-600 rounded-full font-bold">
                  {staleCandidates.length}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mb-3">{"Applied >48 hours ago with no status update"}</p>
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm group-hover:gap-3 transition-all">
                Review Now <ArrowRight size={16} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};