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
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

interface DeleteJobDataProps {
  jobId: string;
  candidates: Candidate[];
  onDelete: () => void;
}

export const DeleteJobData = ({ jobId, candidates, onDelete }: DeleteJobDataProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'confirm' | 'deleting' | 'complete'>('confirm');
  const navigate = useNavigate();

  const handleDelete = async () => {
    setLoading(true);
    setStep('deleting');

    try {
      // Step 1: Delete resumes from Storage
      console.log('🗑️ Deleting resumes from Storage...');
      for (const candidate of candidates) {
        if (candidate.resume_url) {
          try {
            // Extract file path from public URL
            const url = new URL(candidate.resume_url);
            const pathMatch = url.pathname.match(/resumes\/(.+)/);
            if (pathMatch) {
              const filePath = pathMatch[1];
              const { error: storageError } = await supabase.storage
                .from('resumes')
                .remove([`resumes/${filePath}`]);
              
              if (storageError) {
                console.warn(`⚠️ Failed to delete resume for ${candidate.full_name}:`, storageError);
              } else {
                console.log(`✅ Deleted resume: ${filePath}`);
              }
            }
          } catch (err) {
            console.warn(`⚠️ Error parsing resume URL for ${candidate.full_name}:`, err);
          }
        }
      }

      // Step 2: Delete candidates from database
      console.log('🗑️ Deleting candidates from database...');
      const { error: deleteError } = await supabase
        .from('candidates')
        .delete()
        .eq('job_id', jobId);

      if (deleteError) throw deleteError;

      console.log('✅ All candidates deleted successfully');
      
      setStep('complete');
      showSuccess('All candidate data and resumes have been purged');
      
      // Close dialog and navigate after a short delay
      setTimeout(() => {
        setOpen(false);
        onDelete();
        navigate('/talent-pool');
      }, 2000);

    } catch (error) {
      console.error('❌ Error deleting job data:', error);
      showError('Failed to delete some data. Please try again.');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="h-12 px-6 rounded-2xl font-bold gap-2"
        >
          <Trash2 size={18} />
          Delete All Data
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl bg-white/95 backdrop-blur-2xl p-0 overflow-hidden">
        <div className="h-2 bg-red-500" />
        
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-[1.5rem] flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-[#0F172A] tracking-tight">
              {step === 'confirm' && 'Delete All Job Data?'}
              {step === 'deleting' && 'Deleting Data...'}
              {step === 'complete' && 'Deletion Complete'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-base mt-2">
              {step === 'confirm' && (
                <>
                  This will permanently delete <strong>{candidates.length} candidates</strong> and their resumes from storage.
                  <br /><br />
                  <span className="text-red-600 font-medium">This action cannot be undone.</span>
                </>
              )}
              {step === 'deleting' && 'Please wait while we remove all candidate records and resume files...'}
              {step === 'complete' && 'All data has been successfully purged. Redirecting...'}
            </DialogDescription>
          </DialogHeader>

          {step === 'confirm' && (
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                className="h-12 px-6 rounded-2xl font-bold"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="h-12 px-6 rounded-2xl font-bold gap-2"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                Yes, Delete Everything
              </Button>
            </DialogFooter>
          )}

          {step === 'deleting' && (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-red-600" size={40} />
            </div>
          )}

          {step === 'complete' && (
            <div className="flex justify-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-[1.5rem] flex items-center justify-center">
                <Check className="text-emerald-600" size={32} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};