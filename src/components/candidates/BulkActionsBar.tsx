"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, X, Clock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export const BulkActionsBar = ({ selectedIds, onClearSelection, onActionComplete }: BulkActionsBarProps) => {
  const [loading, setLoading] = React.useState(false);

  const updateStatus = async (status: 'good' | 'waiting' | 'rejected') => {
    if (selectedIds.length === 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('candidates')
        .update({ status })
        .in('id', selectedIds);

      if (error) throw error;

      const statusLabels = { good: 'Good Fit', waiting: 'Waiting List', rejected: 'Rejected' };
      showSuccess(`${selectedIds.length} candidates moved to ${statusLabels[status]}`);
      onActionComplete();
      onClearSelection();
    } catch (error) {
      console.error('Error updating candidates:', error);
      showError('Failed to update candidates');
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#0F172A] text-white rounded-2xl shadow-2xl shadow-black/20 p-4 flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 border-r border-white/10">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Users className="text-blue-400" size={18} />
          </div>
          <span className="font-bold">
            {selectedIds.length} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => updateStatus('good')}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold gap-2"
          >
            <Check size={16} />
            Move to Good
          </Button>
          
          <Button
            onClick={() => updateStatus('waiting')}
            disabled={loading}
            className="bg-amber-600 hover:bg-amber-700 rounded-xl font-bold gap-2"
          >
            <Clock size={16} />
            Waiting List
          </Button>
          
          <Button
            onClick={() => updateStatus('rejected')}
            disabled={loading}
            variant="destructive"
            className="rounded-xl font-bold gap-2"
          >
            <X size={16} />
            Reject
          </Button>
        </div>
        
        <div className="border-l border-white/10 pl-4">
          <Button
            onClick={onClearSelection}
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};