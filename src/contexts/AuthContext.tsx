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
  password: string;
  n8nWebhookUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  createdAt: string;
  isAdmin?: boolean;
  userType: UserType;
  fullName?: string;
  phone?: string;
  email?: string;
  // Trial usage tracking
  usageCount?: number;
  jobCount?: number;
  maxScans?: number;
  maxJobs?: number;
}

interface AuthContextType {
  user: TenantUser | null;
  login: (username: string, password: string) => boolean;
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
  password: 'VisionAdmin2024!',
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
  password: 'DemoPass123!',
  n8nWebhookUrl: ENV_N8N_URL,
  supabaseUrl: ENV_SUPABASE_URL,
  supabaseKey: ENV_SUPABASE_KEY,
  createdAt: new Date().toISOString(),
  isAdmin: false,
  userType: 'pro',
  maxScans: Infinity,
  maxJobs: Infinity,
};

const STORAGE_KEY = 'vision_users';
const AUTH_KEY = 'vision_auth';

// Auto-reset stale client candidate caches and upgrade quotas to 50
if (typeof window !== 'undefined' && localStorage.getItem('vision_reset_v7') !== 'true') {
  try {
    localStorage.removeItem('vision_local_candidates');
    const authRaw = localStorage.getItem(AUTH_KEY);
    if (authRaw) {
      const parsed = JSON.parse(authRaw);
      parsed.usageCount = 0;
      parsed.maxScans = 50;
      parsed.maxJobs = 25;
      localStorage.setItem(AUTH_KEY, JSON.stringify(parsed));
    }
    const usersRaw = localStorage.getItem(STORAGE_KEY);
    if (usersRaw) {
      const users: TenantUser[] = JSON.parse(usersRaw);
      const upgraded = users.map(u => {
        if (u.userType === 'trial') {
          return { ...u, maxScans: 50, maxJobs: 25, usageCount: 0 };
        }
        return u;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
    }
    localStorage.setItem('vision_reset_v7', 'true');
  } catch {}
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<TenantUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const session = localStorage.getItem(AUTH_KEY);
      if (!session) return null;
      const parsed = JSON.parse(session);
      if (parsed && parsed.userType === 'trial') {
        parsed.maxJobs = Math.max(parsed.maxJobs || 25, 25);
        parsed.maxScans = Math.max(parsed.maxScans || 50, 50);
        try { localStorage.setItem(AUTH_KEY, JSON.stringify(parsed)); } catch {}
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [quotaStatus, setQuotaStatus] = useState<{ scansExhausted: boolean; jobsExhausted: boolean; updatedAt?: string | null } | null>(null);

  // Initialize default users on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with default users
      const defaultUsers = [ADMIN_USER, DEFAULT_TENANT];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    } else {
      try {
        const users: TenantUser[] = JSON.parse(stored);
        let changed = false;
        const upgraded = users.map(u => {
          if (u.userType === 'trial') {
            const newJobs = Math.max(u.maxJobs || 25, 25);
            const newScans = Math.max(u.maxScans || 50, 50);
            if (u.maxJobs !== newJobs || u.maxScans !== newScans) {
              changed = true;
              return { ...u, maxJobs: newJobs, maxScans: newScans };
            }
          }
          return u;
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
        }
      } catch {}
    }
    
    // Check for existing session
    const session = localStorage.getItem(AUTH_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed && parsed.userType === 'trial') {
          parsed.maxJobs = Math.max(parsed.maxJobs || 25, 25);
          parsed.maxScans = Math.max(parsed.maxScans || 50, 50);
          try { localStorage.setItem(AUTH_KEY, JSON.stringify(parsed)); } catch {}
        }
        setUser(parsed);
        if (parsed?.id && !localStorage.getItem('vision_token')) {
          fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: parsed.id,
              userId: parsed.id,
              email: parsed.email || parsed.username,
            }),
          }).then(r => r.json()).then(data => {
            if (data?.token) setAuthToken(data.token);
          }).catch(() => {});
        }
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
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

  const login = (username: string, password: string): boolean => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const users: TenantUser[] = stored ? JSON.parse(stored) : [ADMIN_USER, DEFAULT_TENANT];
    
    console.log('🔐 Login attempt:', { username });
    console.log('📋 Available users:', users.map(u => ({ username: u.username, userType: u.userType })));
    const cleanInput = username.trim().toLowerCase();
    const found = users.find(u => 
      (u.username.toLowerCase() === cleanInput || (u.email && u.email.toLowerCase() === cleanInput)) && 
      u.password === password
    );
    
    if (found) {
      console.log('✅ User found:', { username: found.username, userType: found.userType, isAdmin: found.isAdmin });
      // Clear previous local tenant candidate caches
      try {
        localStorage.removeItem('vision_local_candidates');
        localStorage.removeItem('hireforce_local_candidates');
      } catch {}
      setUser(found);
      localStorage.setItem(AUTH_KEY, JSON.stringify(found));

      // Obtain cryptographically signed server session token
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: found.id,
          userId: found.id,
          email: found.email || found.username,
        }),
      }).then(r => r.json()).then(data => {
        if (data?.token) setAuthToken(data.token);
      }).catch(() => {});

      return true;
    }
    
    console.warn('❌ Login failed: User not found or password incorrect');
    return false;
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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const users: TenantUser[] = JSON.parse(stored);
    const updatedUsers = users.map(u => 
      u.id === updatedUser.id ? updatedUser : u
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUsers));
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
        login: () => false,
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
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [ADMIN_USER, DEFAULT_TENANT];
};

export const getTrialUsers = (): TenantUser[] => {
  const allUsers = getAllUsers();
  return allUsers.filter(u => u.userType === 'trial');
};

export const addUser = (user: Omit<TenantUser, 'id' | 'createdAt'>): TenantUser => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const users: TenantUser[] = stored ? JSON.parse(stored) : [ADMIN_USER, DEFAULT_TENANT];
  
  // For trial users, assign shared API credentials if not provided
  const userWithCredentials = user.userType === 'trial' && !user.n8nWebhookUrl
    ? {
        ...user,
        n8nWebhookUrl: MASTER_API_CONFIG.n8nWebhookUrl,
        supabaseUrl: MASTER_API_CONFIG.supabaseUrl,
        supabaseKey: MASTER_API_CONFIG.supabaseKey,
      }
    : user;
  
  const newUser: TenantUser = {
    ...userWithCredentials,
    id: `tenant-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  return newUser;
};

export const deleteUser = (userId: string): boolean => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;
  
  const users: TenantUser[] = JSON.parse(stored);
  const filtered = users.filter(u => u.id !== userId && !u.isAdmin); // Prevent deleting admin
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
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

// Reset localStorage to clear corrupted state
export const resetAuthStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(AUTH_KEY);
  const defaultUsers = [ADMIN_USER, DEFAULT_TENANT];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
  console.log('🔄 Auth storage reset. Default users reinitialized.');
};