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
    <div className="min-h-screen bg-cyan-100 flex flex-col items-center justify-center p-6">
      {/* Logo at top left */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
          <Zap className="text-white fill-white" size={16} />
        </div>
        <span className="text-lg font-bold text-gray-800">HireForce</span>
      </div>

      <Card className="w-full max-w-md border-0 rounded-xl shadow-sm relative z-10">
        <CardHeader className="p-8 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-white" size={24} />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600 text-sm mt-2">
            Sign in to access your screening dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-bold text-gray-700 uppercase">
                Username
              </Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
                className="h-10 rounded-lg border-gray-300 bg-white px-4 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold text-gray-700 uppercase">
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
                  className="h-10 rounded-lg border-gray-300 bg-white px-4 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-cyan-500" />
                <span className="text-gray-600 font-medium">Remember me</span>
              </label>
              <a href="#" className="text-cyan-600 font-semibold hover:text-cyan-700">
                Forgot password?
              </a>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-10 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-sm"
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Trial Registration Link */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 font-medium text-center mb-4">
              Don't have an account?
            </p>
            <Link to="/trial">
              <Button 
                className="w-full h-10 rounded-lg font-semibold text-white bg-cyan-500 hover:bg-cyan-600 text-sm gap-2"
              >
                Start a Free Trial
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 font-medium">
          © 2026 HireForce. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;