"use client";

import React from 'react';
import { Candidate } from '@/lib/supabase';

interface JobFunnelBarProps {
  candidates: Candidate[];
  className?: string;
}

export const JobFunnelBar = ({ candidates, className }: JobFunnelBarProps) => {
  const total = candidates.length;
  if (total === 0) return null;

  const counts = {
    new: candidates.filter(c => !c.status || c.status === 'new').length,
    good: candidates.filter(c => c.status === 'good').length,
    waiting: candidates.filter(c => c.status === 'waiting').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    hired: candidates.filter(c => c.status === 'hired').length,
  };

  const getPercentage = (count: number) => (count / total) * 100;

  return (
    <div className={className}>
      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
        {counts.new > 0 && (
          <div 
            className="bg-blue-500 transition-all duration-500"
            style={{ width: `${getPercentage(counts.new)}%` }}
            title={`New: ${counts.new}`}
          />
        )}
        {counts.good > 0 && (
          <div 
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${getPercentage(counts.good)}%` }}
            title={`Good: ${counts.good}`}
          />
        )}
        {counts.waiting > 0 && (
          <div 
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${getPercentage(counts.waiting)}%` }}
            title={`Waiting: ${counts.waiting}`}
          />
        )}
        {counts.rejected > 0 && (
          <div 
            className="bg-red-500 transition-all duration-500"
            style={{ width: `${getPercentage(counts.rejected)}%` }}
            title={`Rejected: ${counts.rejected}`}
          />
        )}
        {counts.hired > 0 && (
          <div 
            className="bg-purple-500 transition-all duration-500"
            style={{ width: `${getPercentage(counts.hired)}%` }}
            title={`Hired: ${counts.hired}`}
          />
        )}
      </div>
      <div className="flex gap-3 mt-2 text-xs">
        {counts.new > 0 && <span className="text-blue-600 font-medium">{counts.new} New</span>}
        {counts.good > 0 && <span className="text-emerald-600 font-medium">{counts.good} Good</span>}
        {counts.hired > 0 && <span className="text-purple-600 font-medium">{counts.hired} Hired</span>}
      </div>
    </div>
  );
};