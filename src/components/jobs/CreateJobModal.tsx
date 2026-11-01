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
import { Plus, Sparkles, Loader2, Copy, Check, ExternalLink, MapPin, HelpCircle, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { createJobInSupabase } from '@/lib/api';
import { formatSalary } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { TrialLimitModal } from '@/components/trial/TrialLimitModal';

const CreateJobModal = () => {
  const { user, isTrial, hasReachedJobLimit, incrementJobCount } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [applyLink, setApplyLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCustomCriteria, setShowCustomCriteria] = useState(false);

  // Workplace type and saved location states
  const [workplaceType, setWorkplaceType] = useState<'remote' | 'hybrid' | 'physical'>('remote');
  const [officeLocation, setOfficeLocation] = useState<string>(() => {
    return localStorage.getItem('hireforce_saved_office_location') || '';
  });
  const [saveLocationAsDefault, setSaveLocationAsDefault] = useState<boolean>(true);
  const [salaryInput, setSalaryInput] = useState<string>('');
  const [clientCompanyName, setClientCompanyName] = useState<string>(() => user?.companyName || '');
  const defaultCurrency = typeof window !== 'undefined' ? (localStorage.getItem('hireforce_default_currency') || 'PKR') : 'PKR';

  // Custom screening questions states
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>([]);
  const [newQuestionText, setNewQuestionText] = useState<string>('');

  const queryClient = useQueryClient();

  const handleOpen = () => {
    if (isTrial && hasReachedJobLimit()) {
      setShowLimitModal(true);
      return;
    }
    const saved = localStorage.getItem('hireforce_saved_office_location');
    if (saved) {
      setOfficeLocation(saved);
    }
    setOpen(true);
  };

  React.useEffect(() => {
    const handler = () => handleOpen();
    window.addEventListener('open_create_job', handler as EventListener);
    return () => window.removeEventListener('open_create_job', handler as EventListener);
  }, [isTrial, user]);

  const handleAddQuestion = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (screeningQuestions.includes(trimmed)) {
      showError("This question has already been added.");
      return;
    }
    setScreeningQuestions(prev => [...prev, trimmed]);
    setNewQuestionText('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setScreeningQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isTrial && hasReachedJobLimit()) {
      setShowLimitModal(true);
      return;
    }
    
    setLoading(true);
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    const title = (formData.get('title') as string || '').trim();
    const company_name = (formData.get('company_name') as string || '').trim() || clientCompanyName.trim() || user?.companyName || 'HireForce';
    const department = (formData.get('department') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const customReq = (formData.get('requirements') as string || '').trim();

    // Determine final location string based on workplaceType
    let resolvedLocation = 'Remote';
    if (workplaceType === 'physical') {
      resolvedLocation = officeLocation.trim() || 'On-site';
    } else if (workplaceType === 'hybrid') {
      resolvedLocation = officeLocation.trim() ? `Hybrid • ${officeLocation.trim()}` : 'Hybrid';
    }

    // Save office location for future jobs if user opted in
    if (saveLocationAsDefault && officeLocation.trim() && (workplaceType === 'physical' || workplaceType === 'hybrid')) {
      localStorage.setItem('hireforce_saved_office_location', officeLocation.trim());
    }

    // Auto-format salary with PKR prefix without requiring user to type it
    const formattedSalary = salaryInput.trim() ? formatSalary(salaryInput.trim()) : '';

    const payload = {
      company_name,
      title,
      department: department || 'General',
      location: resolvedLocation,
      salary: formattedSalary,
      description,
      requirements: customReq || description,
      screening_questions: screeningQuestions.join('\n'),
    };

    try {
      const newRecord = await createJobInSupabase(payload, user?.id);
      if (!newRecord || !newRecord.id) {
        throw new Error("Failed to save job in database");
      }
      const jobId = newRecord.id;
      const generatedLink = `${window.location.origin}/apply/${jobId}`;
      
      if (isTrial) {
        incrementJobCount();
      }
      
      setApplyLink(generatedLink);
      showSuccess("Job created successfully!");
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      
    } catch (error: any) {
      console.error("Job creation error:", error);
      showError(error.message || "Failed to create job.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (applyLink) {
      navigator.clipboard.writeText(applyLink);
      setCopied(true);
      showSuccess("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setOpen(false);
    setApplyLink(null);
    setCopied(false);
    setSalaryInput('');
    setScreeningQuestions([]);
    setNewQuestionText('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => { if(!val) reset(); setOpen(val); }}>
        <DialogTrigger asChild>
          <Button 
            onClick={handleOpen}
            className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} />
            <span>Create New Job</span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg bg-white border border-zinc-200/90 rounded-xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
          {applyLink ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <Check size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Job Successfully Created</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Your public application link is ready to share with candidates.</p>
              </div>
              
              <div className="bg-zinc-50 border border-zinc-200 rounded-md p-2.5 flex items-center gap-2">
                <span className="flex-1 truncate text-left font-mono text-xs text-zinc-700 select-all">
                  {applyLink}
                </span>
                <Button 
                  onClick={copyToClipboard} 
                  variant="outline" 
                  size="sm"
                  className="h-7 px-2 text-xs border-zinc-300"
                >
                  {copied ? <Check size={12} className="text-emerald-600 mr-1" /> : <Copy size={12} className="mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-semibold" onClick={reset}>
                  Close
                </Button>
                <Button 
                  size="sm"
                  className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5" 
                  onClick={() => window.open(applyLink, '_blank')}
                >
                  <ExternalLink size={12} />
                  Open Application Page
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <DialogHeader className="text-left pb-2 border-b border-zinc-100">
                <DialogTitle className="text-base font-bold text-zinc-900">Create Job Opening</DialogTitle>
                <p className="text-xs text-zinc-500">Post a new opening to start collecting and AI-screening candidate resumes.</p>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700">Job Title *</Label>
                  <Input 
                    name="title" 
                    required 
                    placeholder="e.g. Senior Frontend Engineer" 
                    className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-zinc-700">Hiring Company / Client</Label>
                    <span className="text-[10px] text-zinc-400">In emails</span>
                  </div>
                  <Input 
                    name="company_name" 
                    value={clientCompanyName}
                    onChange={(e) => setClientCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp or Client Name" 
                    className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 -mt-2 block">
                Hiring for a client? Enter their company name so applicant emails & interview invites show their brand.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700">Department</Label>
                  <Input 
                    name="department" 
                    placeholder="Engineering / Product" 
                    className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>

                {/* Workplace Type Dropdown */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700">Workplace Type</Label>
                  <select 
                    value={workplaceType}
                    onChange={(e) => setWorkplaceType(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-md border border-zinc-200 text-xs bg-white text-zinc-800 font-medium focus-visible:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="remote">Remote (Anywhere)</option>
                    <option value="hybrid">Hybrid (Office + Remote)</option>
                    <option value="physical">On-site / Physical Office</option>
                  </select>
                </div>
              </div>

              {/* Conditional Physical Office / City Location Input */}
              {(workplaceType === 'physical' || workplaceType === 'hybrid') && (
                <div className="p-3 bg-zinc-50/80 rounded-lg border border-zinc-200 space-y-2 animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-600" />
                      {workplaceType === 'physical' ? 'Office Location / City' : 'Office Base Location (Hybrid)'}
                    </Label>
                    {localStorage.getItem('hireforce_saved_office_location') && (
                      <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Auto-filled from saved
                      </span>
                    )}
                  </div>
                  <Input 
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    required
                    placeholder="e.g. Karachi, Pakistan or Shahrah-e-Faisal, Karachi" 
                    className="h-9 text-xs rounded-md border-zinc-200 bg-white focus-visible:ring-emerald-500"
                  />
                  <label className="flex items-center gap-2 pt-0.5 text-[11px] text-zinc-600 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={saveLocationAsDefault}
                      onChange={(e) => setSaveLocationAsDefault(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Save this location as default for future job posts</span>
                  </label>
                </div>
              )}

              {/* Salary with Auto PKR Prefix */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-zinc-700">Salary Range (Optional - Auto {defaultCurrency})</Label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-zinc-500 select-none pointer-events-none">
                    {defaultCurrency}
                  </span>
                  <Input 
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    placeholder="150,000 - 250,000 / month" 
                    className="pl-12 h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500 font-medium"
                  />
                </div>
                <span className="text-[10px] text-zinc-400 block">Currency is automatically set to {defaultCurrency}. Enter numbers or range (e.g. 120,000 or 150,000 - 250,000).</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-zinc-700">Job Description & Role Requirements</Label>
                  <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auto-Evaluated by AI
                  </span>
                </div>
                <Textarea 
                  name="description" 
                  required 
                  placeholder="Paste your full job description here (responsibilities, required skills, tools, and qualifications). The AI screening engine will automatically use this entire scope to evaluate and score applicant resumes..." 
                  className="min-h-[110px] text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Candidate Screening Questions (Optional) */}
              <div className="p-3 bg-zinc-50/80 rounded-lg border border-zinc-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <HelpCircle size={13} className="text-emerald-600" />
                    Applicant Screening Questions (Optional)
                  </Label>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {screeningQuestions.length} {screeningQuestions.length === 1 ? 'question' : 'questions'} added
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input 
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddQuestion(newQuestionText);
                      }
                    }}
                    placeholder="e.g. Do you have 2+ years of professional experience in React?"
                    className="h-8.5 text-xs rounded-md border-zinc-200 bg-white focus-visible:ring-emerald-500 flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddQuestion(newQuestionText)}
                    disabled={!newQuestionText.trim()}
                    className="h-8.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    <Plus size={13} className="mr-1" />
                    Add
                  </Button>
                </div>

                {/* Quick Suggestion Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-zinc-400 font-medium">Quick Presets:</span>
                  {[
                    "Years of relevant domain experience?",
                    "Are you comfortable with USA timings (8PM - 5AM PKT)?",
                    "What is your notice period / earliest joining date?",
                    "What is your expected monthly salary (PKR)?"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddQuestion(preset)}
                      className="text-[10px] bg-white hover:bg-emerald-50 text-zinc-600 hover:text-emerald-800 border border-zinc-200 hover:border-emerald-200 px-2 py-0.5 rounded transition-all cursor-pointer shadow-2xs"
                    >
                      + {preset.length > 25 ? preset.substring(0, 25) + '...' : preset}
                    </button>
                  ))}
                </div>

                {/* List of Added Questions */}
                {screeningQuestions.length > 0 && (
                  <div className="space-y-1.5 pt-1.5 border-t border-zinc-200/60">
                    {screeningQuestions.map((q, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 bg-white border border-zinc-200 rounded-md text-xs text-zinc-800 shadow-2xs"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="truncate leading-tight font-medium text-zinc-800">{q}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-zinc-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                          title="Remove Question"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Custom Criteria Expansion */}
              <div>
                {!showCustomCriteria ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomCriteria(true)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={12} />
                    <span>Add Custom AI Screening Weighting / Knockout Rules (Optional)</span>
                  </button>
                ) : (
                  <div className="space-y-1 pt-1.5 border-t border-zinc-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-zinc-700">Custom Screening Criteria (Optional Override)</Label>
                      <button
                        type="button"
                        onClick={() => setShowCustomCriteria(false)}
                        className="text-[10px] text-zinc-400 hover:text-zinc-600 font-medium cursor-pointer"
                      >
                        Hide
                      </button>
                    </div>
                    <Textarea 
                      name="requirements" 
                      placeholder="Optional override: Specific knockout criteria, must-have degrees, or specific weighted tools..." 
                      className="min-h-[65px] text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                    />
                    <span className="text-[10px] text-zinc-400 block">If left empty, the AI screening engine automatically extracts all evaluation criteria from the Job Description above.</span>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="animate-spin" size={13} />
                      Publishing...
                    </span>
                  ) : (
                    "Publish Job"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <TrialLimitModal 
        open={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        type="job" 
      />
    </>
  );
};

export default CreateJobModal;
