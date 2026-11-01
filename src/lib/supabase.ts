"use client";

import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://fobfgvmwfzoxzzcheusm.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvYmZndm13ZnpveHp6Y2hldXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMTMxNjAsImV4cCI6MjEwODc4OTE2MH0.EixGdozHbc0EFI6I7YCc15IyG-5ocTUUtGMKjXimPIQ';

const envUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
export const isSupabaseConfigured = Boolean(
  envUrl && 
  !envUrl.includes('placeholder-disabled')
);

const supabaseUrl = isSupabaseConfigured ? envUrl : DEFAULT_SUPABASE_URL;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Job = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  created_at: string;
  status?: string;
  department?: string;
  salary?: string;
  screening_questions?: string;
  user_id?: string;
};

export type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  resume_url: string;
  job_id: string;
  screening_score: number | null;
  screening_summary?: string | null;
  linkedin?: string;
  created_at?: string;
  status?: 'new' | 'good' | 'waiting' | 'rejected' | 'hired';
  user_id?: string;
};

export type UserRole = 'admin' | 'viewer';
