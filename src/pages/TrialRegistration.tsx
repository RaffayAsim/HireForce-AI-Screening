import React, { useState } from 'react';
import { User, Building2, Mail, Phone, Loader2, ArrowRight, Sparkles, ShieldCheck, CheckCircle, Copy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { addUser, generateCredentials, useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '../utils/toast';

const TrialRegistration = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{username: string, password: string} | null>(null);
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
    
    try {
      // Generate random credentials
      const { username, password } = generateCredentials();
      
      // Create trial user
      const trialUser = addUser({
        companyName: formData.organizationName,
        username,
        password,
        userType: 'trial',
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        maxScans: 5,
        maxJobs: 1,
        usageCount: 0,
        jobCount: 0,
      });
      
      console.log("Trial Lead Captured:", formData);
      console.log("Trial User Created:", trialUser);
      
      // Show credentials
      setCredentials({ username, password });
      setShowCredentials(true);
      
      // Auto-login the user
      const loginSuccess = login(username, password);
      if (loginSuccess) {
        showSuccess('Trial account created and logged in successfully!');
      } else {
        showSuccess('Trial account created successfully!');
      }
    } catch (error) {
      console.error('Error creating trial user:', error);
      // You might want to show an error toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyan-100 flex flex-col items-center justify-center p-6">
      
      {/* Brand Header */}
      <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-cyan-500 p-2 rounded-lg">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">Hire Force</span>
        </div>
        <p className="text-gray-600 font-medium text-sm">The Smart Way to Build Your Team.</p>
      </div>

      <Card className="w-full max-w-xl border border-gray-200 shadow-sm bg-white rounded-lg overflow-hidden">
        <CardHeader className="p-8 pb-6 text-center border-b border-gray-200">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Start Your Free Trial
          </CardTitle>
          <CardDescription className="text-gray-600 text-sm">
            Get 5 AI-powered candidate scans & 1 job posting free
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-10 pt-0">
          {showCredentials && credentials ? (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                <h3 className="text-2xl font-black text-slate-900 mb-2">Welcome to Hire Force!</h3>
                <p className="text-slate-500">Your trial account has been created. Here are your login credentials:</p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <Label className="text-sm font-bold text-emerald-800 mb-2 block">Username</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={credentials.username} 
                      readOnly 
                      className="flex-1 bg-white border-emerald-200 text-emerald-900 font-mono"
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => navigator.clipboard.writeText(credentials.username)}
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <Label className="text-sm font-bold text-emerald-800 mb-2 block">Password</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={credentials.password} 
                      readOnly 
                      type="password"
                      className="flex-1 bg-gray-50 border-gray-300 text-gray-900 font-mono text-sm"
                    />
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => navigator.clipboard.writeText(credentials.password)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full h-10 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-sm gap-2"
                >
                  Start Using Hire Force
                  <ArrowRight size={16} />
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium">
                  You are now logged in! Click above to access your dashboard
                </p>
              </div>
            </div>
          ) : (
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
                className="h-10 rounded-lg border-gray-300 bg-white px-4 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName" className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                <Building2 size={12} className="text-cyan-600" />
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
                className="h-10 rounded-lg border-gray-300 bg-white px-4 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                  <Mail size={12} className="text-cyan-600" />
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
                  className="h-10 rounded-lg border-gray-300 bg-white px-4 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-gray-700 uppercase flex items-center gap-2">
                  <Phone size={12} className="text-cyan-600" />
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
                  className="h-10 rounded-lg border-gray-300 bg-white px-4 text-sm"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-10 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-sm gap-2 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    Deploy My Trial
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>

            <div className="mt-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-emerald-600" size={16} />
                <span className="text-sm font-bold text-emerald-800">Trial Power:</span>
              </div>
              <ul className="text-xs text-emerald-700/70 space-y-1 ml-6 list-disc font-medium">
                <li>1 Active Job Posting</li>
                <li>5 AI Candidate Observation Scans</li>
                <li>Full Access to Hire Force Dashboard</li>
                <li>Zero Configuration Required</li>
              </ul>
            </div>
          </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400 font-medium">
              Already have an account?{' '}
              <a href="/login" className="text-emerald-600 font-bold hover:underline">
                Sign in here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

          <div className="mt-8 text-center">
        <p className="text-sm text-slate-400 font-medium">
          © 2026 Hire Force AI. Secure. Intelligent. Automated.
        </p>
      </div>
    </div>
  );
};

export default TrialRegistration;