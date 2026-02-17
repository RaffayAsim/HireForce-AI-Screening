import React, { useState } from 'react';
import { User, Building2, Mail, Phone, Loader2, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

const TrialRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    organizationName: '',
    email: '',
    phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulating API call to generate trial credentials
    setTimeout(() => {
      setLoading(false);
      // Logic for redirect or credential display would go here
      console.log("Trial Lead Captured:", formData);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50 via-white to-white flex flex-col items-center justify-center p-6">
      
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-gradient-to-br from-[#00F5A0] to-[#00D9F5] p-2 rounded-xl">
            <ShieldCheck className="text-white" size={28} />
          </div>
          <span className="text-3xl font-black tracking-tighter text-slate-900">HireAxis</span>
        </div>
        <p className="text-slate-500 font-medium">The Smart Way to Build Your Team.</p>
      </div>

      <Card className="w-full max-w-xl border-none shadow-[0_20px_50px_rgba(0,245,160,0.15)] bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 pb-6 text-center">
          <CardTitle className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">Free Trial</span>
          </CardTitle>
          <CardDescription className="text-slate-500 text-lg font-medium">
            Get 5 AI-powered candidate scans & 1 job posting free
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-10 pt-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={14} className="text-emerald-500" />
                Full Name *
              </Label>
              <Input 
                id="fullName" 
                name="fullName"
                type="text" 
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required 
                className="h-14 rounded-2xl border-slate-100 bg-white focus-visible:ring-emerald-500/30 px-5 text-base shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Building2 size={14} className="text-emerald-500" />
                Organization Name *
              </Label>
              <Input 
                id="organizationName" 
                name="organizationName"
                type="text" 
                placeholder="Acme Corporation"
                value={formData.organizationName}
                onChange={handleChange}
                required 
                className="h-14 rounded-2xl border-slate-100 bg-white focus-visible:ring-emerald-500/30 px-5 text-base shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail size={14} className="text-emerald-500" />
                  Email *
                </Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required 
                  className="h-14 rounded-2xl border-slate-100 bg-white focus-visible:ring-emerald-500/30 px-5 text-base shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Phone size={14} className="text-emerald-500" />
                  Phone *
                </Label>
                <Input 
                  id="phone" 
                  name="phone"
                  type="tel" 
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  required 
                  className="h-14 rounded-2xl border-slate-100 bg-white focus-visible:ring-emerald-500/30 px-5 text-base shadow-sm"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] hover:opacity-90 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 border-none gap-2 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    Deploy My Trial
                    <ArrowRight size={20} />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 font-medium">
              Already have an account?{' '}
              <a href="/login" className="text-emerald-600 font-bold hover:underline">
                Sign in here
              </a>
            </p>
          </div>

          <div className="mt-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-emerald-600" size={16} />
              <span className="text-sm font-bold text-emerald-800">Trial Power:</span>
            </div>
            <ul className="text-xs text-emerald-700/70 space-y-1 ml-6 list-disc font-medium">
              <li>1 Active Job Posting</li>
              <li>5 AI Candidate Observation Scans</li>
              <li>Full Access to HireAxis Dashboard</li>
              <li>Zero Configuration Required</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-400 font-medium">
          © 2026 HireAxis AI. Secure. Intelligent. Automated.
        </p>
      </div>
    </div>
  );
};

export default TrialRegistration;