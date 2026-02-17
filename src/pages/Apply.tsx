import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  Check, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { fetchJobById, createCandidateApplication } from '@/lib/api';
import { showSuccess, showError } from '@/utils/toast';
import { useAuth } from '@/contexts/AuthContext';
import { TrialLimitModal } from '@/components/trial/TrialLimitModal';

const Apply = () => {
  const { jobId } = useParams();
  const { isTrial, hasReachedScanLimit, incrementUsage } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    fetchJobById(jobId).then(data => {
      setJob(data);
      if (data.screening_questions) {
        const questions = data.screening_questions
          .split('\n')
          .filter((line: string) => line.trim().toLowerCase().startsWith('question:'))
          .map((line: string) => line.replace(/^[Qq]uestion:\s*/i, '').trim());
        setCustomQuestions(questions);
      }
    }).catch(err => {
      console.error("Error fetching job:", err);
      showError("Could not load job details.");
    });
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;
    
    // Check scan limit for trial users before processing
    if (isTrial && hasReachedScanLimit()) {
      setShowLimitModal(true);
      return;
    }
    
    setLoading(true);
    const formElement = e.target as HTMLFormElement;
    const formData = new FormData(formElement);
    
    try {
      await createCandidateApplication({
        job_id: jobId,
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        linkedin: formData.get('linkedin') as string,
        cover_letter: formData.get('cover_letter') as string,
        screening_answers: customQuestions.map((_, i) => formData.get(`question_${i}`) as string),
        resume_file: file,
      });
      
      if (isTrial) {
        incrementUsage();
      }
      
      setSubmitted(true);
      showSuccess('Application submitted successfully!');
    } catch (error) {
      console.error('Application error:', error);
      showError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border-none bg-white/95 backdrop-blur-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 ring-1 ring-emerald-500/20">
              <Check className="text-emerald-600" size={48} />
            </div>
            <h1 className="text-3xl font-black text-[#0F172A] mb-4 tracking-tight">Application Submitted!</h1>
            <p className="text-slate-500 text-lg mb-8">
              Thank you for applying. Our AI will review your resume and the team will get back to you soon.
            </p>
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 inline-block">
              <p className="text-emerald-700 font-bold flex items-center gap-2">
                <Sparkles size={18} />
                AI screening in progress...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  const isScanLimitReached = isTrial && hasReachedScanLimit();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10 px-4">
      {/* Job Header */}
      <Card className="rounded-[2.5rem] overflow-hidden shadow-xl border-none bg-white">
        <CardContent className="p-8 md:p-10">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center ring-1 ring-emerald-100 flex-shrink-0">
              <Briefcase className="text-emerald-600" size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-2"><MapPin size={14} /> {job.location || 'Remote'}</span>
                {job.salary && <span className="flex items-center gap-2"><DollarSign size={14} /> {job.salary}</span>}
                <span className="flex items-center gap-2"><Calendar size={14} /> Active</span>
              </div>
            </div>
          </div>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">{job.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card className="rounded-[2.5rem] overflow-hidden shadow-2xl border-none bg-white">
        <CardContent className="p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-emerald-600 rounded-[1rem] flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Apply Now</h2>
              <p className="text-slate-500 text-sm">AI-Powered Screening enabled for this position.</p>
            </div>
          </div>

          {isScanLimitReached ? (
            <div className="p-10 bg-amber-50 rounded-[2.5rem] border border-amber-200 text-center">
              <AlertCircle className="text-amber-600 mx-auto mb-4" size={56} />
              <h3 className="text-2xl font-black text-amber-900 mb-2">Limit Reached</h3>
              <p className="text-amber-700 mb-8 font-medium">
                This trial account has reached the maximum of 5 candidate scans. Upgrade to Pro to continue.
              </p>
              <Button 
                onClick={() => setShowLimitModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold px-10 h-14"
              >
                Unlock Unlimited Access
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                  <Input name="name" required className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all px-5" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                  <Input name="email" type="email" required className="h-14 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all px-5" />
                </div>
              </div>

              {customQuestions.map((question, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">{question}</Label>
                  <Textarea name={`question_${index}`} required className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50 focus:bg-white p-5" />
                </div>
              ))}

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Upload Resume (PDF)</Label>
                <Input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleFileChange} 
                  required 
                  className="h-14 rounded-2xl border-slate-100 file:bg-emerald-600 file:text-white file:border-none file:rounded-lg file:px-4 file:h-8 file:mt-2 cursor-pointer"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-black text-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Submit Application"}
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
  );
};

export default Apply;