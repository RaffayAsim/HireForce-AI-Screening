"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ThumbsUp, 
  Clock, 
  ThumbsDown, 
  Mail, 
  ExternalLink, 
  Sparkles,
  FileText,
  Phone,
  Check,
  ChevronDown
} from 'lucide-react';
import { Candidate } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

type CandidateStatus = 'new' | 'good' | 'waiting' | 'rejected' | 'hired';

interface CandidateCardProps {
  candidate: Candidate;
  onStatusChange: (newStatus: CandidateStatus) => void;
  onClick: () => void;
}

const statusConfig = {
  new: { 
    borderColor: 'border-blue-200', 
    bgColor: 'bg-blue-50', 
    label: 'New',
    dropdownColor: 'bg-blue-600',
    lightColor: 'text-blue-600',
    bgLight: 'bg-blue-100'
  },
  good: { 
    borderColor: 'border-emerald-300', 
    bgColor: 'bg-emerald-50', 
    label: 'Good Fit',
    dropdownColor: 'bg-emerald-600',
    lightColor: 'text-emerald-600',
    bgLight: 'bg-emerald-100'
  },
  waiting: { 
    borderColor: 'border-amber-200', 
    bgColor: 'bg-amber-50', 
    label: 'Waiting',
    dropdownColor: 'bg-amber-500',
    lightColor: 'text-amber-600',
    bgLight: 'bg-amber-100'
  },
  rejected: { 
    borderColor: 'border-red-300', 
    bgColor: 'bg-red-50', 
    label: 'Rejected',
    dropdownColor: 'bg-red-500',
    lightColor: 'text-red-600',
    bgLight: 'bg-red-100'
  },
  hired: { 
    borderColor: 'border-purple-200', 
    bgColor: 'bg-purple-50', 
    label: 'Hired',
    dropdownColor: 'bg-purple-600',
    lightColor: 'text-purple-600',
    bgLight: 'bg-purple-100'
  },
};

const statusOptions: { value: CandidateStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'new', label: 'New', color: 'text-blue-600', icon: <Clock size={14} /> },
  { value: 'good', label: 'Good Fit', color: 'text-emerald-600', icon: <ThumbsUp size={14} /> },
  { value: 'waiting', label: 'Waiting List', color: 'text-amber-600', icon: <Clock size={14} /> },
  { value: 'rejected', label: 'Rejected', color: 'text-red-600', icon: <ThumbsDown size={14} /> },
  { value: 'hired', label: 'Hired', color: 'text-purple-600', icon: <Check size={14} /> },
];

export const CandidateCard = ({ candidate, onStatusChange, onClick }: CandidateCardProps) => {
  const [loading, setLoading] = useState(false);
  const currentStatus = (candidate.status || 'new') as CandidateStatus;
  const config = statusConfig[currentStatus];

  const handleStatusUpdate = async (newStatus: CandidateStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || newStatus === currentStatus) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', candidate.id);

      if (error) throw error;

      showSuccess(`${candidate.full_name} moved to ${statusConfig[newStatus].label}`);
      onStatusChange(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-slate-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    return "text-amber-600";
  };

  return (
    <Card 
      className={cn(
        "rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-2",
        config.borderColor,
        config.bgColor
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header: Avatar + Name + Score */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-3 border-white shadow-md">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.full_name}`} />
              <AvatarFallback className="text-lg font-bold bg-slate-200">
                {candidate.full_name?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-bold text-[#0F172A] text-lg leading-tight">{candidate.full_name || 'Unknown'}</h4>
              <p className="text-sm text-slate-500">{candidate.email}</p>
              {candidate.phone && (
                <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                  <Phone size={10} />
                  <span>{candidate.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className={cn("text-2xl font-black", getScoreColor(candidate.screening_score))}>
              {candidate.screening_score !== null ? `${candidate.screening_score}%` : '—'}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Match</div>
          </div>
        </div>

        {/* Status Dropdown Button for HR */}
        <div className="mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full rounded-xl font-bold text-sm gap-2 border-2 transition-all",
                  config.borderColor,
                  config.bgLight,
                  config.lightColor,
                  "hover:opacity-80"
                )}
                disabled={loading}
                onClick={(e) => e.stopPropagation()}
              >
                <span className={cn("w-2 h-2 rounded-full", config.dropdownColor)} />
                {config.label}
                <ChevronDown size={14} className="ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-48">
              {statusOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={(e) => handleStatusUpdate(option.value, e as any)}
                  className={cn(
                    "rounded-lg cursor-pointer gap-2",
                    currentStatus === option.value && "bg-slate-100"
                  )}
                >
                  <span className={option.color}>{option.icon}</span>
                  <span className={option.color}>{option.label}</span>
                  {currentStatus === option.value && <Check size={14} className="ml-auto text-slate-600" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* AI Summary Preview */}
        {candidate.screening_summary && (
          <div className="mb-4 p-3 bg-white/70 rounded-xl border border-white/50">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={12} className="text-blue-500" />
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">AI Analysis</span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {candidate.screening_summary}
            </p>
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-4 border-t border-white/50">
          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 rounded-xl p-0 transition-all",
                currentStatus === 'good' 
                  ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                  : "bg-white/50 text-slate-600 hover:bg-emerald-100 hover:text-emerald-600"
              )}
              onClick={(e) => handleStatusUpdate('good', e)}
              disabled={loading}
              title="Good Fit"
            >
              <ThumbsUp size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 rounded-xl p-0 transition-all",
                currentStatus === 'waiting' 
                  ? "bg-amber-500 text-white hover:bg-amber-600" 
                  : "bg-white/50 text-slate-600 hover:bg-amber-100 hover:text-amber-600"
              )}
              onClick={(e) => handleStatusUpdate('waiting', e)}
              disabled={loading}
              title="Waiting List"
            >
              <Clock size={16} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 rounded-xl p-0 transition-all",
                currentStatus === 'rejected' 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-white/50 text-slate-600 hover:bg-red-100 hover:text-red-600"
              )}
              onClick={(e) => handleStatusUpdate('rejected', e)}
              disabled={loading}
              title="Reject"
            >
              <ThumbsDown size={16} />
            </Button>
          </div>

          {/* Contact Links */}
          <div className="flex items-center gap-1">
            {candidate.email && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-xl p-0 bg-white/50 text-slate-600 hover:bg-blue-100 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`mailto:${candidate.email}`, '_blank');
                }}
              >
                <Mail size={16} />
              </Button>
            )}
            {candidate.resume_url && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 rounded-xl p-0 bg-white/50 text-slate-600 hover:bg-blue-100 hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(candidate.resume_url, '_blank');
                }}
              >
                <FileText size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Status Badge - Small indicator */}
        <div className="mt-3 flex justify-end">
          <Badge className={cn(
            "rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider border",
            currentStatus === 'new' && "bg-blue-500/20 text-blue-700 border-blue-500/30",
            currentStatus === 'good' && "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
            currentStatus === 'waiting' && "bg-amber-500/20 text-amber-700 border-amber-500/30",
            currentStatus === 'rejected' && "bg-red-500/20 text-red-700 border-red-500/30",
            currentStatus === 'hired' && "bg-purple-500/20 text-purple-700 border-purple-500/30",
          )}>
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};