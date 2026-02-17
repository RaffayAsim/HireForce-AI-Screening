"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

type CandidateStatus = 'new' | 'good' | 'waiting' | 'rejected' | 'hired';

interface StatusBadgeProps {
  status: CandidateStatus | undefined;
  className?: string;
}

const statusConfig: Record<CandidateStatus, { label: string; className: string }> = {
  new: { 
    label: 'New', 
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
  },
  good: { 
    label: 'Good Fit', 
    className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
  },
  waiting: { 
    label: 'Waiting', 
    className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
  },
  rejected: { 
    label: 'Rejected', 
    className: 'bg-red-500/10 text-red-600 border-red-500/20' 
  },
  hired: { 
    label: 'Hired', 
    className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' 
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = status ? statusConfig[status] : { 
    label: 'New', 
    className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
  };

  return (
    <Badge className={cn(
      "rounded-full px-3 py-1 font-bold text-xs uppercase tracking-wider border",
      config.className,
      className
    )}>
      {config.label}
    </Badge>
  );
};

export const getStatusColor = (status: CandidateStatus | undefined) => {
  const colors = {
    new: 'bg-blue-500',
    good: 'bg-emerald-500',
    waiting: 'bg-amber-500',
    rejected: 'bg-red-500',
    hired: 'bg-purple-500',
  };
  return status ? colors[status] : 'bg-blue-500';
};