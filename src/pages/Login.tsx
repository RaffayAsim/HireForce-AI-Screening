"use client";

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, Eye, EyeOff, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { showError } from '@/utils/toast';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      if (user?.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const success = login(username, password);
    
    if (success) {
      if (username.toLowerCase() === 'admin@vision.ai') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      showError('Invalid username or password');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-300/10 rounded-full blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="absolute top-12 left-12 flex items-center gap-4 z-10">
        <div className="w-14 h-14 vision-gradient rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 ring-2 ring-white/50">
          <Zap className="text-white fill-white" size={28} />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-black tracking-tight leading-none text-[#0F2E1F]">Vision</span>
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600 mt-1">Factory</span>
        </div>
      </div>

      <Card className="w-full max-w-md glass-card rounded-[2.5rem] shadow-2xl border-none relative z-10 overflow-hidden">
        <div className="h-2 vision-gradient" />
        
        <CardHeader className="p-10 pb-6 text-center">
          <div className="w-20 h-20 vision-gradient rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-100">
            <Sparkles className="text-white" size={36} />
          </div>
          <CardTitle className="text-3xl font-black text-[#0F2E1F] tracking-tight">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-emerald-700/70 text-base mt-2 font-medium">
            Sign in to access your screening dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-10 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-bold text-emerald-800/70 uppercase tracking-widest ml-1">
                Username
              </Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                className="h-14 rounded-2xl border-emerald-200 bg-white/70 focus-visible:ring-emerald-500/30 px-5 text-base placeholder:text-emerald-800/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-emerald-800/70 uppercase tracking-widest ml-1">
                Password
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="h-14 rounded-2xl border-emerald-200 bg-white/70 focus-visible:ring-emerald-500/30 px-5 pr-12 text-base placeholder:text-emerald-800/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600/50 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-emerald-300 text-emerald-500 focus:ring-emerald-500" />
                <span className="text-emerald-800/70 font-medium">Remember me</span>
              </label>
              <a href="#" className="text-emerald-600 font-bold hover:text-emerald-700">
                Forgot password?
              </a>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 vision-button text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/30 border-none"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={24} />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Trial Registration Link */}
          <div className="mt-8 pt-6 border-t border-emerald-100">
            <p className="text-sm text-emerald-800/60 font-medium text-center mb-4">
              Don't have an account?
            </p>
            <Link to="/trial">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-2xl font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-2"
              >
                <Sparkles size={18} />
                Start a Free Trial
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <p className="text-xs text-emerald-800/70 font-medium text-center">
              <span className="font-bold">Demo Credentials:</span><br />
              Admin: admin@vision.ai / VisionAdmin2024!<br />
              Pro: demo@hireflow.ai / DemoPass123!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-sm text-emerald-800/50 font-medium">
          © 2024 Vision Factory. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;