"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscribeToCandidates, subscribeToJobs } from '@/lib/api';
import { getLocalJobs } from '@/lib/localDatabase';
import { setAuthToken, removeAuthToken } from '@/lib/authHeader';

export type UserType = 'admin' | 'pro' | 'trial';

export interface TenantUser {
  id: string;
  companyName: string;
  username: string;
  password?: string;
  n8nWebhookUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  createdAt: string;
  isAdmin?: boolean;
  userType: UserType;
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
  // Trial usage tracking
  usageCount?: number;
  jobCount?: number;
  maxScans?: number;
  maxJobs?: number;
}

interface AuthContextType {
  user: TenantUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isPro: boolean;
  isTrial: boolean;
  isAuthenticated: boolean;
  incrementUsage: () => boolean;
  incrementJobCount: () => boolean;
  hasReachedScanLimit: () => boolean;
  hasReachedJobLimit: () => boolean;
  getRemainingScans: () => number;
  quotaStatus: {
    scansExhausted: boolean;
    jobsExhausted: boolean;
    updatedAt?: string | null;
  } | null;
  acknowledgeQuota: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fobfgvmwfzoxzzcheusm.supabase.co';
const ENV_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMTMxNjAsImV4cCI6MjEwODc4OTE2MH0.EixGdozHbc0EFI6I7YCc15IyG-5ocTUUtGMKjXimPIQ';
const ENV_N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://raffayasim.app.n8n.cloud/webhook/resume-screening';

// Default admin user
const ADMIN_USER: TenantUser = {
  id: 'admin-001',
  companyName: 'HireForce',
  username: 'admin@vision.ai',
  n8nWebhookUrl: ENV_N8N_URL,
  supabaseUrl: ENV_SUPABASE_URL,
  supabaseKey: ENV_SUPABASE_KEY,
  createdAt: new Date().toISOString(),
  isAdmin: true,
  userType: 'admin',
  maxScans: Infinity,
  maxJobs: Infinity,
};

// Default tenant user (Pro user)
const DEFAULT_TENANT: TenantUser = {
  id: 'tenant-001',
  companyName: 'HireFlow Demo',
  username: 'demo@hireflow.ai',
  n8nWebhookUrl: ENV_N8N_URL,
  supabaseUrl: ENV_SUPABASE_URL,
  supabaseKey: ENV_SUPABASE_KEY,
  createdAt: new Date().toISOString(),
  isAdmin: false,
  userType: 'pro',
  maxScans: Infinity,
  maxJobs: Infinity,
};

const AUTH_KEY = 'vision_auth';

// Clean legacy localStorage credentials
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('vision_users');
  } catch {}
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<TenantUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const session = localStorage.getItem(AUTH_KEY);
      if (!session) return null;
      return JSON.parse(session);
    } catch {
      return null;
    }
  });
  const [quotaStatus, setQuotaStatus] = useState<{ scansExhausted: boolean; jobsExhausted: boolean; updatedAt?: string | null } | null>(null);

  // Validate session on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vision_token') : null;
    const session = typeof window !== 'undefined' ? localStorage.getItem(AUTH_KEY) : null;

    if (token && session) {
      try {
        const parsed = JSON.parse(session);
        setUser(parsed);

        // Verify and refresh session token with server
        fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }).then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            if (data?.token) setAuthToken(data.token);
          } else if (r.status === 401) {
            setUser(null);
            removeAuthToken();
            localStorage.removeItem(AUTH_KEY);
          }
        }).catch(() => {});
      } catch {
        setUser(null);
        removeAuthToken();
        localStorage.removeItem(AUTH_KEY);
      }
    } else {
      setUser(null);
      removeAuthToken();
      localStorage.removeItem(AUTH_KEY);
    }
  }, []);

  // Keep auth state in sync across tabs and internal updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) {
        if (!e.newValue) {
          setUser(null);
          return;
        }
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.userType === 'trial') {
            parsed.maxJobs = Math.max(parsed.maxJobs || 25, 25);
            parsed.maxScans = Math.max(parsed.maxScans || 50, 50);
          }
          setUser(parsed);
        } catch {
          // ignore parse errors
        }
      }
    };

    const handleAuthUpdate = () => {
      const session = localStorage.getItem(AUTH_KEY);
      if (!session) {
        setUser(null);
        return;
      }
      try {
        const parsed = JSON.parse(session);
        if (parsed && parsed.userType === 'trial') {
          parsed.maxJobs = Math.max(parsed.maxJobs || 25, 25);
          parsed.maxScans = Math.max(parsed.maxScans || 50, 50);
        }
        setUser(parsed);
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth_update', handleAuthUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth_update', handleAuthUpdate as EventListener);
    };
  }, []);

  // Recompute usage and job counts in real-time from Supabase subscriptions
  useEffect(() => {
    if (!user || user.userType !== 'trial') return;
    if (!user.id) return;

    let unsubCandidates: (() => void) | null = null;
    let unsubJobs: (() => void) | null = null;

    try {
      unsubCandidates = subscribeToCandidates((candidates) => {
        if (!localStorage.getItem(AUTH_KEY)) return;
        const count = Array.isArray(candidates) ? candidates.length : 0;
        const currentUserRaw = localStorage.getItem(AUTH_KEY);
        if (!currentUserRaw) return;
        const parsedUser = JSON.parse(currentUserRaw);
        const updatedUser = { ...parsedUser, usageCount: count };
        updateUserInStorage(updatedUser);
        setUser(updatedUser);

        const scansExhausted = (updatedUser.usageCount || 0) >= (updatedUser.maxScans || 50);
        setQuotaStatus(prev => ({ ...(prev || {}), scansExhausted, updatedAt: new Date().toISOString(), jobsExhausted: prev?.jobsExhausted || false }));
      }, user.id);

      unsubJobs = subscribeToJobs((jobs) => {
        if (!localStorage.getItem(AUTH_KEY)) return;
        const count = Array.isArray(jobs) ? jobs.length : 0;
        const currentUserRaw = localStorage.getItem(AUTH_KEY);
        if (!currentUserRaw) return;
        const parsedUser = JSON.parse(currentUserRaw);
        const updatedUser = { ...parsedUser, jobCount: count };
        updateUserInStorage(updatedUser);
        setUser(updatedUser);

        const jobsExhausted = (updatedUser.jobCount || 0) >= (updatedUser.maxJobs || 25);
        setQuotaStatus(prev => ({ ...(prev || {}), jobsExhausted, updatedAt: new Date().toISOString(), scansExhausted: prev?.scansExhausted || false }));
      }, user.id);
    } catch (err) {
      console.warn('Could not subscribe to remote candidate/job counts', err);
    }

    return () => {
      try { unsubCandidates && unsubCandidates(); } catch {}
      try { unsubJobs && unsubJobs(); } catch {}
    };
  }, [user?.id, user?.userType]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const cleanEmail = username.trim().toLowerCase();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      if (!res.ok) {
        console.warn('❌ Login failed with status:', res.status);
        return false;
      }

      const data = await res.json();
      if (!data.success || !data.token) {
        console.warn('❌ Login failed:', data.error);
        return false;
      }

      // Clear previous local tenant candidate caches
      try {
        localStorage.removeItem('vision_local_candidates');
        localStorage.removeItem('hireforce_local_candidates');
      } catch {}

      setAuthToken(data.token);

      const loggedUser: TenantUser = {
        id: data.user.tenantId || data.user.id,
        companyName: data.user.company || 'Hiring Workspace',
        username: data.user.email,
        email: data.user.email,
        fullName: data.user.name,
        userType: data.user.userType || 'pro',
        isAdmin: data.user.userType === 'admin',
        n8nWebhookUrl: ENV_N8N_URL,
        supabaseUrl: ENV_SUPABASE_URL,
        supabaseKey: ENV_SUPABASE_KEY,
        createdAt: new Date().toISOString(),
        maxScans: data.user.userType === 'trial' ? 50 : Infinity,
        maxJobs: data.user.userType === 'trial' ? 25 : Infinity,
      };

      setUser(loggedUser);
      localStorage.setItem(AUTH_KEY, JSON.stringify(loggedUser));
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    try {
      setUser(null);
      removeAuthToken();
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem('vision_local_candidates');
      localStorage.removeItem('hireforce_local_candidates');
      window.dispatchEvent(new Event('auth_update'));
    } catch {}
    window.location.href = '/login';
  };

  // Usage tracking functions
  const incrementUsage = (): boolean => {
    if (!user) return false;
    if (user.userType !== 'trial') return true; // Pro/Admin users have no limits
    
    const currentUsage = user.usageCount || 0;
    const effectiveMaxScans = Math.max(user.maxScans || 50, 50);
    if (currentUsage >= effectiveMaxScans) {
      return false; // Limit reached
    }

    const updatedUser = {
      ...user,
      maxScans: effectiveMaxScans,
      maxJobs: Math.max(user.maxJobs || 25, 25),
      usageCount: currentUsage + 1
    };

    // Update in storage
    updateUserInStorage(updatedUser);
    setUser(updatedUser);
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    // Notify other listeners (same-tab and other components)
    try { window.dispatchEvent(new Event('auth_update')); } catch {}

    // If we've reached the limit after incrementing, notify the user
    if ((updatedUser.usageCount || 0) >= effectiveMaxScans) {
      setQuotaStatus(prev => ({ ...(prev || {}), scansExhausted: true, updatedAt: new Date().toISOString(), jobsExhausted: prev?.jobsExhausted || false }));
    }
    return true;
  };

  const incrementJobCount = (): boolean => {
    if (!user) return false;
    if (user.userType !== 'trial') return true; // Pro/Admin users have no limits
    
    const effectiveMax = Math.max(user.maxJobs || 25, 25);
    const localJobs = typeof window !== 'undefined' ? getLocalJobs() : [];
    const currentActiveJobs = localJobs.filter(j => !j.user_id || j.user_id === user.id).length;
    
    if (currentActiveJobs >= effectiveMax) {
      return false; // Limit reached
    }

    const updatedUser: TenantUser = {
      ...user,
      maxJobs: effectiveMax,
      maxScans: Math.max(user.maxScans || 50, 50),
      jobCount: currentActiveJobs + 1
    };

    updateUserInStorage(updatedUser);
    setUser(updatedUser);
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    try { window.dispatchEvent(new Event('auth_update')); } catch {}

    if ((currentActiveJobs + 1) >= effectiveMax) {
      setQuotaStatus(prev => ({ ...(prev || {}), jobsExhausted: true, updatedAt: new Date().toISOString(), scansExhausted: prev?.scansExhausted || false }));
    }
    return true;
  };

  const hasReachedScanLimit = (): boolean => {
    if (!user) return true;
    if (user.userType !== 'trial') return false;
    const effectiveMaxScans = Math.max(user.maxScans || 50, 50);
    return (user.usageCount || 0) >= effectiveMaxScans;
  };

  const hasReachedJobLimit = (): boolean => {
    if (!user) return true;
    if (user.userType !== 'trial') return false;
    const effectiveMax = Math.max(user.maxJobs || 25, 25);
    const localJobs = typeof window !== 'undefined' ? getLocalJobs() : [];
    const activeJobs = localJobs.filter(j => !j.user_id || j.user_id === user.id);
    return activeJobs.length >= effectiveMax;
  };

  const getRemainingScans = (): number => {
    if (!user) return 0;
    if (user.userType !== 'trial') return Infinity;
    const effectiveMaxScans = Math.max(user.maxScans || 50, 50);
    return Math.max(0, effectiveMaxScans - (user.usageCount || 0));
  };

  const updateUserInStorage = (updatedUser: TenantUser) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.userType === 'admin',
      isPro: user?.userType === 'pro',
      isTrial: user?.userType === 'trial',
      isAuthenticated: !!user,
      incrementUsage,
      incrementJobCount,
      hasReachedScanLimit,
      hasReachedJobLimit,
      getRemainingScans,
      quotaStatus,
      acknowledgeQuota: () => setQuotaStatus(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(AUTH_KEY) : null;
      const cachedUser = raw ? JSON.parse(raw) : null;
      return {
        user: cachedUser,
        login: async () => false,
        logout: () => {},
        isAdmin: cachedUser?.userType === 'admin',
        isPro: cachedUser?.userType === 'pro',
        isTrial: cachedUser?.userType === 'trial',
        isAuthenticated: !!cachedUser,
        incrementUsage: () => false,
        incrementJobCount: () => false,
        hasReachedScanLimit: () => false,
        hasReachedJobLimit: () => false,
        getRemainingScans: () => 10,
        quotaStatus: null,
        acknowledgeQuota: () => {},
      };
    } catch {
      throw new Error('useAuth must be used within an AuthProvider');
    }
  }
  return context;
};

// Helper functions for admin management
export const getAllUsers = (): TenantUser[] => {
  return [ADMIN_USER, DEFAULT_TENANT];
};

export const getTrialUsers = (): TenantUser[] => {
  const allUsers = getAllUsers();
  return allUsers.filter(u => u.userType === 'trial');
};

export const addUser = (user: Omit<TenantUser, 'id' | 'createdAt'>): TenantUser => {
  const newUser: TenantUser = {
    ...user,
    id: `tenant-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  return newUser;
};

export const deleteUser = (_userId: string): boolean => {
  return true;
};

export const generateCredentials = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let username = '';
  let password = '';
  
  for (let i = 0; i < 8; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length));
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return { username, password };
};

// Master API credentials for trial users
export const MASTER_API_CONFIG = {
  n8nWebhookUrl: ENV_N8N_URL,
  supabaseUrl: ENV_SUPABASE_URL,
  supabaseKey: ENV_SUPABASE_KEY,
};

// Reset auth storage
export const resetAuthStorage = () => {
  localStorage.removeItem(AUTH_KEY);
  removeAuthToken();
};