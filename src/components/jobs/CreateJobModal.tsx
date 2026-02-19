"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Sparkles, Loader2, Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { createJobInSupabase } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { TrialLimitModal } from '@/components/trial/TrialLimitModal';

const CreateJobModal = () => {
  const { user, isViewer, isTrial, hasReachedJobLimit, incrementJobCount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [applyLink, setApplyLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  // Don't render if viewer
  if (isViewer) return null;

  const handleOpen = () => {
    if (isTrial && hasReachedJobLimit()) {
      setShowLimitModal(true);
      return;
    }
    setOpen(true);
  };

  // Listen for global requests to open the create-job modal
  React.useEffect(() => {
    const handler = () => handleOpen();
    window.addEventListener('open_create_job', handler as EventListener);
    return () => window.removeEventListener('open_create_job', handler as EventListener);
  }, [isTrial, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check limit again before submitting
    if (isTrial && hasReachedJobLimit()) {
      setShowLimitModal(true);
      return;
    }
    
    setLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      console.log('📝 Form data received:', data);
      
      const newRecord = await createJobInSupabase(data, user?.id);
      const jobId = newRecord.id;
      const generatedLink = `${window.location.origin}/apply/${jobId}`;
      
      console.log('✅ Job created successfully:', { jobId, generatedLink });
      
      // Increment job count for trial users
      if (isTrial) {
        incrementJobCount();
      }
      
      setApplyLink(generatedLink);
      showSuccess("Job created successfully in Supabase!");
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      
    } catch (error: any) {
      console.error("❌ Job creation error:", error);
      showError(error.message || "Failed to create job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (applyLink) {
      navigator.clipboard.writeText(applyLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setOpen(false);
    setApplyLink(null);
    setCopied(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => { if(!val) reset(); setOpen(val); }}>
        <DialogTrigger asChild>
          <Button 
            onClick={handleOpen}
            className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-8 shadow-xl shadow-emerald-600/20 gap-3 font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={22} />
            Create New Job
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-[2rem] border-none shadow-2xl bg-white/95 backdrop-blur-2xl p-0 overflow-hidden">
          <div className="h-3 bg-gradient-to-r from-emerald-500 to-teal-600" />
          
          {applyLink ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/20">
                <Check className="text-emerald-600" size={40} />
              </div>
              <h2 className="text-2xl font-black text-[#0F172A] mb-3 tracking-tight">Job Successfully Created!</h2>
              <p className="text-slate-500 text-sm font-medium mb-8">Your application link is ready to be shared with candidates.</p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3 mb-8">
                <div className="flex-1 truncate text-left font-mono text-xs text-slate-600 px-2">
                  {applyLink}
                </div>
                <Button onClick={copyToClipboard} variant="ghost" className="h-10 w-10 rounded-xl hover:bg-white shadow-sm">
                  {copied ? <Check className="text-emerald-600" size={16} /> : <Copy size={16} />}
                </Button>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold text-sm border-slate-200" onClick={reset}>
                  Close
                </Button>
                <Button className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-600/20 gap-2" onClick={() => window.open(applyLink, '_blank')}>
                  Preview Page <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 max-h-[calc(90vh-3rem)] overflow-y-auto">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-black text-[#0F172A] tracking-tight">Create New Job Opening</DialogTitle>
                <p className="text-slate-500 text-xs mt-2">Jobs are stored in Supabase PostgreSQL database</p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Job Title</Label>
                    <Input id="title" name="title" placeholder="e.g. Senior Product Designer" required className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus-visible:ring-emerald-500/20 px-4 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Department / Location</Label>
                    <Input 
                      id="department" 
                      name="department" 
                      placeholder="e.g. Engineering, Remote" 
                      required 
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus-visible:ring-emerald-500/20 px-4 text-sm" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salary" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Salary Range</Label>
                  <Input id="salary" name="salary" placeholder="e.g. $120k - $150k" className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus-visible:ring-emerald-500/20 px-4 text-sm" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Job Description</Label>
                  <Textarea id="description" name="description" placeholder="Describe the role and responsibilities..." className="min-h-[80px] rounded-2xl border-slate-200 bg-slate-50/50 focus-visible:ring-emerald-500/20 p-4 text-sm" required />
                </div>

                <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <HelpCircle className="text-emerald-600" size={16} />
                      </div>
                      <div>
                        <Label htmlFor="screening_questions" className="text-sm font-bold text-[#0F172A]">Custom Screening Questions</Label>
                        <p className="text-xs text-slate-500 mt-1">Add specific questions for candidates</p>
                      </div>
                    </div>
                    <Textarea 
                      id="screening_questions" 
                      name="screening_questions"
                      placeholder={`Add custom screening questions, one per line:

Question: What motivates you in your work?
Question: Describe your experience with [specific technology]
Question: How do you handle tight deadlines?`}
                      className="bg-white/70 border-emerald-200 rounded-2xl focus-visible:ring-emerald-500/50 p-4 min-h-[100px] placeholder:text-slate-400 text-sm"
                    />
                    <p className="text-xs text-emerald-600 font-medium mt-2">
                      💡 These questions will appear in the application form
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/20 rounded-full blur-3xl" />
                </div>

                <div className="p-6 bg-[#0F172A] rounded-[2rem] shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles className="text-emerald-400" size={18} />
                      <Label htmlFor="requirements" className="text-white font-bold text-sm">Requirements / AI Scorecard</Label>
                    </div>
                    <Textarea 
                      id="requirements" 
                      name="requirements"
                      placeholder="What are you looking for? (e.g. Must have 3 years of React, experience with SaaS, strong communication skills)" 
                      className="bg-white/10 border-white/10 text-white rounded-2xl focus-visible:ring-emerald-500/50 p-4 min-h-[80px] placeholder:text-slate-500 text-sm"
                      required
                    />
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-3xl" />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    Generate Job & Application Link
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <TrialLimitModal 
        open={showLimitModal} 
        onClose={() => {
          setShowLimitModal(false);
          if (isTrial) {
            // Close parent create job dialog for trial users to prevent further actions
            setOpen(false);
          }
        }} 
        type="job"
      />
    </>
  );
};

export default CreateJobModal;