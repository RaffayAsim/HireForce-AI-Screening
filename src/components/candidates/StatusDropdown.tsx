"use client";

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from 'lucide-react';
import { Candidate } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';

type CandidateStatus = 'new' | 'good' | 'waiting' | 'rejected' | 'hired';

interface StatusDropdownProps {
  candidate: Candidate;
  onStatusChange?: (newStatus: CandidateStatus) => void;
}

const statusOptions: { value: CandidateStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'text-blue-600' },
  { value: 'good', label: 'Good Fit', color: 'text-emerald-600' },
  { value: 'waiting', label: 'Waiting List', color: 'text-amber-600' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-600' },
  { value: 'hired', label: 'Hired', color: 'text-purple-600' },
];

export const StatusDropdown = ({ candidate, onStatusChange }: StatusDropdownProps) => {
  const [currentStatus, setCurrentStatus] = useState<CandidateStatus>(candidate.status || 'new');
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (newStatus === currentStatus) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status: newStatus })
        .eq('id', candidate.id);

      if (error) throw error;

      setCurrentStatus(newStatus);
      showSuccess(`Status updated to ${statusOptions.find(s => s.value === newStatus)?.label}`);
      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const currentOption = statusOptions.find(s => s.value === currentStatus) || statusOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="rounded-xl font-bold text-sm gap-2 min-w-[140px]"
          disabled={loading}
        >
          <span className={currentOption.color}>{currentOption.label}</span>
          <ChevronDown size={16} className="text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className="rounded-lg cursor-pointer"
          >
            <div className="flex items-center justify-between w-full min-w-[140px]">
              <span className={option.color}>{option.label}</span>
              {currentStatus === option.value && <Check size={16} className="text-slate-600" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};