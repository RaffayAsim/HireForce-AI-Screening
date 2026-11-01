import { triggerAutomation } from '@/lib/automationService';
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  UploadCloud
} from 'lucide-react';
import { fetchJobById, createCandidateApplication, setTenantConfig } from '@/lib/api';
import { formatSalary } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { TrialLimitModal } from '@/components/trial/TrialLimitModal';

const Apply = () => {
  const { jobId } = useParams();
  const { user, isTrial, hasReachedScanLimit, incrementUsage } = useAuth();
  const [job, setJob] = useState<any>(() => {
    if (typeof window === 'undefined' || !jobId) return null;
    try {
      const cached = JSON.parse(localStorage.getItem('vision_jobs') || '[]');
      return cached.find((j: any) => j.id === jobId) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    if (user) {
      setTenantConfig({
        n8nWebhookUrl: user.n8nWebhookUrl,
        supabaseUrl: user.supabaseUrl,
        supabaseKey: user.supabaseKey,
      });
    }
  }, [user]);

  useEffect(() => {
    if (!jobId) return;
    fetchJobById(jobId).then(data => {
      setJob(data);
      if (data.screening_questions) {
        let questions: string[] = [];
        if (Array.isArray(data.screening_questions)) {
          questions = data.screening_questions.map((q: any) => String(q).trim()).filter(Boolean);
        } else if (typeof data.screening_questions === 'string') {
          questions = data.screening_questions
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0)
            .map((line: string) => line.replace(/^[Qq]uestion:\s*/i, '').trim());
        }
        setCustomQuestions(questions);
      }
    }).catch(err => {
      console.error("Error fetching job:", err);
      showError("Could not load job details.");
    });
  }, [jobId]);

  const [extractedResumeText, setExtractedResumeText] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      try {
        if (selected.type.includes('text') || selected.name.endsWith('.txt') || selected.name.endsWith('.md')) {
          const text = await selected.text();
          setExtractedResumeText(text);
        } else {
          // Binary PDF/DOC files are extracted via server-side pdf-parse directly from storage
          setExtractedResumeText('');
        }
      } catch { }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    if (isTrial && hasReachedScanLimit()) {
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);

    try {
      const applyPromise = createCandidateApplication({
        job_id: jobId,
        jobTitle: job?.title || '',
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        linkedin: formData.get('linkedin') as string,
        cover_letter: formData.get('cover_letter') as string,
        screening_answers: customQuestions.map((_, i) => formData.get(`question_${i}`) as string),
        resume_file: file,
        resume_text: extractedResumeText,
        company_name: (job as any)?.company || (job as any)?.company_name || user?.companyName,
        recruiter_name: user?.fullName || (job as any)?.recruiter_name,
      }, job?.user_id);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Application submission timed out. Please try again.')), 15000)
      );

      await Promise.race([applyPromise, timeoutPromise]);

      if (isTrial) {
        incrementUsage();
      }

      // Immediately display submission confirmation to the applicant (FIX 3)
      setSubmitted(true);
      setLoading(false);
      showSuccess('Application submitted successfully!');
    } catch (error: any) {
      console.error('Application error:', error);
      showError(error?.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 text-zinc-900 font-sans">
        <Card className="w-full max-w-md bg-white border border-zinc-200/90 shadow-sm rounded-xl overflow-hidden text-center p-8">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 mb-1.5">Application Submitted</h1>
          <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
            Thank you for applying. Your application has been received and the company is currently evaluating your profile.
          </p>
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-md inline-flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={14} className="text-emerald-600" />
            Company is Evaluating Your Application
          </div>
        </Card>
      </div>
    );
  }

  if (!job && jobId) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="text-center text-xs text-zinc-400">
          <Loader2 className="animate-spin text-emerald-600 mx-auto mb-2" size={24} />
          <p>Loading application form...</p>
        </div>
      </div>
    );
  }

  const isScanLimitReached = isTrial && hasReachedScanLimit();

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-10 px-4 text-zinc-900 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#18181B] text-emerald-400 flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <span className="text-sm font-bold text-zinc-900">HireForce AI</span>
          </Link>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Actively Hiring
          </span>
        </div>

        {/* Job Details Card */}
        {job && (
          <Card className="bg-white border border-zinc-200/90 shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-3.5 mb-3">
                <div className="w-10 h-10 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Briefcase size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-zinc-900">{job.title}</h1>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-zinc-400" />
                      {job.location || 'Remote'}
                    </span>
                    {job.salary && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-700 font-medium">{formatSalary(job.salary)}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">Actively Hiring</span>
                  </div>
                </div>
              </div>
              {job.description && (
                <div className="pt-3 border-t border-zinc-100 text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application Form Card */}
        <Card className="bg-white border border-zinc-200/90 shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="mb-5 pb-4 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">Candidate Application</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Please provide your background details and resume.</p>
            </div>

            {isScanLimitReached ? (
              <div className="p-6 bg-amber-50 rounded-lg border border-amber-200 text-center">
                <AlertCircle className="text-amber-600 mx-auto mb-2" size={32} />
                <h3 className="text-sm font-bold text-amber-900">Application Limit Reached</h3>
                <p className="text-xs text-amber-700 mt-1 mb-4">
                  This trial employer has reached their limit of 5 scans.
                </p>
                <Button
                  onClick={() => setShowLimitModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold"
                >
                  Upgrade Employer Workspace
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-zinc-700">Full Name</Label>
                    <Input
                      name="name"
                      required
                      placeholder="Jane Doe"
                      className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-zinc-700">Email Address</Label>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="jane@example.com"
                      className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-zinc-700">Phone</Label>
                    <Input
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-zinc-700">LinkedIn Profile URL</Label>
                    <Input
                      name="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      className="h-9 text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                {customQuestions.map((q, i) => (
                  <div key={i} className="space-y-1">
                    <Label className="text-xs font-semibold text-zinc-700">{q}</Label>
                    <Textarea
                      name={`question_${i}`}
                      required
                      className="min-h-[70px] text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                    />
                  </div>
                ))}

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-zinc-700">Cover Letter (Optional)</Label>
                  <Textarea
                    name="cover_letter"
                    placeholder="Briefly describe why you are interested in this position..."
                    className="min-h-[80px] text-xs rounded-md border-zinc-200 focus-visible:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-700">Resume / CV (PDF Only)</Label>
                  <div className="border border-dashed border-zinc-300 rounded-lg p-4 text-center hover:bg-zinc-50 transition-colors">
                    <UploadCloud size={24} className="text-zinc-400 mx-auto mb-1.5" />
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required
                      className="text-xs file:bg-emerald-600 file:text-white file:border-none file:rounded file:px-3 file:py-1 file:text-xs cursor-pointer"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs shadow-sm transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="animate-spin" size={14} />
                      Submitting Application...
                    </span>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <TrialLimitModal
          open={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          type="scan"
        />
      </div>
    </div>
  );
};

export default Apply;
