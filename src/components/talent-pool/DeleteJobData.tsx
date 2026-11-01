"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Loader2, AlertTriangle, Check } from 'lucide-react';
import { Candidate } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { deleteLocalJob } from '@/lib/localDatabase';
import { useNavigate } from 'react-router-dom';

interface DeleteJobDataProps {
  jobId: string;
  candidates: Candidate[];
  onDelete: () => void;
}

export const DeleteJobData = ({ jobId, candidates, onDelete }: DeleteJobDataProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    setLoading(true);
    try {
      deleteLocalJob(jobId);
      showSuccess('Job pipeline data cleared successfully');
      setOpen(false);
      onDelete();
      navigate('/talent-pool');
    } catch (error) {
      console.error('Error deleting job data:', error);
      showError('Failed to clear job data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 rounded-md text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 gap-1.5 transition-all"
        >
          <Trash2 size={13} />
          <span>Clear Data</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-lg">
        <DialogHeader className="text-left space-y-2">
          <div className="w-9 h-9 bg-red-50 border border-red-200 rounded-md flex items-center justify-center text-red-600">
            <AlertTriangle size={18} />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-zinc-900">
              Clear Job Candidates & Data?
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 mt-1">
              This will remove all {candidates.length} candidates associated with this role from your local workspace.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="animate-spin" size={13} />}
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
