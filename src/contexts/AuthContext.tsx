"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscribeToCandidates, subscribeToJobs } from '@/lib/api';

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

// Default admin user
const ADMIN_USER: TenantUser = {
  id: 'admin-001',
  companyName: 'HireForce',
  username: 'admin@vision.ai',
  password: 'VisionAdmin2024!',
  n8nWebhookUrl: 'https://jamesy982.app.n8n.cloud/webhook/resume-screening',
  supabaseUrl: 'https://sziksecdqwwvnmuxjiim.supabase.co',
  supabaseKey: 'sb_publishable_aB2yXeG8m0KjDLZbpr8Wpg_ndKoRxKa',
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
  n8nWebhookUrl: 'https://jamesy982.app.n8n.cloud/webhook/resume-screening',
  supabaseUrl: 'https://sziksecdqwwvnmuxjiim.supabase.co',
  supabaseKey: 'sb_publishable_aB2yXeG8m0KjDLZbpr8Wpg_ndKoRxKa',
  createdAt: new Date().toISOString(),
  isAdmin: false,
  userType: 'pro',
  maxScans: Infinity,
  maxJobs: Infinity,
};

const STORAGE_KEY = 'vision_users';
const AUTH_KEY = 'vision_auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<TenantUser | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<{ scansExhausted: boolean; jobsExhausted: boolean; updatedAt?: string | null } | null>(null);

  // Initialize default users on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with default users
      const defaultUsers = [ADMIN_USER, DEFAULT_TENANT];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    }
    
    // Check for existing session
    const session = localStorage.getItem(AUTH_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUser(parsed);
      } catch {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  // Keep auth state in sync across tabs and internal updates
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) {
        try {
          const parsed = e.newValue ? JSON.parse(e.newValue) : null;
          setUser(parsed);
        } catch {
          // ignore parse errors
        }
      }
    };

    const handleAuthUpdate = () => {
      const session = localStorage.getItem(AUTH_KEY);
      if (session) {
        try {
          const parsed = JSON.parse(session);
          setUser(parsed);
        } catch {
          // ignore
        }
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
        const count = Array.isArray(candidates) ? candidates.length : 0;
        const updatedUser = { ...user, usageCount: count };
        updateUserInStorage(updatedUser);
        setUser(updatedUser);
        try { window.dispatchEvent(new Event('auth_update')); } catch {}

        const scansExhausted = (updatedUser.usageCount || 0) >= (updatedUser.maxScans || 5);
        setQuotaStatus(prev => ({ ...(prev || {}), scansExhausted, updatedAt: new Date().toISOString(), jobsExhausted: prev?.jobsExhausted || false }));
      }, user.id);

      unsubJobs = subscribeToJobs((jobs) => {
        const count = Array.isArray(jobs) ? jobs.length : 0;
        const updatedUser = { ...user, jobCount: count };
        updateUserInStorage(updatedUser);
        setUser(updatedUser);
        try { window.dispatchEvent(new Event('auth_update')); } catch {}

        const jobsExhausted = (updatedUser.jobCount || 0) >= (updatedUser.maxJobs || 1);
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
    
    const found = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );
    
    if (found) {
      console.log('✅ User found:', { username: found.username, userType: found.userType, isAdmin: found.isAdmin });
      setUser(found);
      localStorage.setItem(AUTH_KEY, JSON.stringify(found));
      return true;
    }
    
    console.warn('❌ Login failed: User not found or password incorrect');
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  // Usage tracking functions
  const incrementUsage = (): boolean => {
    if (!user) return false;
    if (user.userType !== 'trial') return true; // Pro/Admin users have no limits
    
    const currentUsage = user.usageCount || 0;
    if (currentUsage >= (user.maxScans || 5)) {
      return false; // Limit reached
    }

    const updatedUser = {
      ...user,
      usageCount: currentUsage + 1
    };

    // Update in storage
    updateUserInStorage(updatedUser);
    setUser(updatedUser);
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    // Notify other listeners (same-tab and other components)
    try { window.dispatchEvent(new Event('auth_update')); } catch {}

    // If we've reached the limit after incrementing, notify the user
    if ((updatedUser.usageCount || 0) >= (updatedUser.maxScans || 5)) {
      setQuotaStatus(prev => ({ ...(prev || {}), scansExhausted: true, updatedAt: new Date().toISOString(), jobsExhausted: prev?.jobsExhausted || false }));
    }
    return true;
  };

  const incrementJobCount = (): boolean => {
    if (!user) return false;
    if (user.userType !== 'trial') return true; // Pro/Admin users have no limits
    
    const currentJobs = user.jobCount || 0;
    if (currentJobs >= (user.maxJobs || 1)) {
      return false; // Limit reached
    }

    const updatedUser = {
      ...user,
      jobCount: currentJobs + 1
    };

    updateUserInStorage(updatedUser);
    setUser(updatedUser);
    localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    try { window.dispatchEvent(new Event('auth_update')); } catch {}

    if ((updatedUser.jobCount || 0) >= (updatedUser.maxJobs || 1)) {
      setQuotaStatus(prev => ({ ...(prev || {}), jobsExhausted: true, updatedAt: new Date().toISOString(), scansExhausted: prev?.scansExhausted || false }));
    }
    return true;
  };

  const hasReachedScanLimit = (): boolean => {
    if (!user) return true;
    if (user.userType !== 'trial') return false;
    return (user.usageCount || 0) >= (user.maxScans || 5);
  };

  const hasReachedJobLimit = (): boolean => {
    if (!user) return true;
    if (user.userType !== 'trial') return false;
    return (user.jobCount || 0) >= (user.maxJobs || 1);
  };

  const getRemainingScans = (): number => {
    if (!user) return 0;
    if (user.userType !== 'trial') return Infinity;
    return (user.maxScans || 5) - (user.usageCount || 0);
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
    throw new Error('useAuth must be used within an AuthProvider');
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
  n8nWebhookUrl: 'https://jamesy982.app.n8n.cloud/webhook/resume-screening',
  supabaseUrl: 'https://sziksecdqwwvnmuxjiim.supabase.co',
  supabaseKey: 'sb_publishable_aB2yXeG8m0KjDLZbpr8Wpg_ndKoRxKa',
};

// Reset localStorage to clear corrupted state
export const resetAuthStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(AUTH_KEY);
  const defaultUsers = [ADMIN_USER, DEFAULT_TENANT];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
  console.log('🔄 Auth storage reset. Default users reinitialized.');
};