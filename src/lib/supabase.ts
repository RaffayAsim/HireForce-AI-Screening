"use client";

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sziksecdqwwvnmuxjiim.supabase.co';
const supabaseKey = 'sb_publishable_aB2yXeG8m0KjDLZbpr8Wpg_ndKoRxKa';

export const supabase = createClient(supabaseUrl, supabaseKey);

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
};

export type UserRole = 'admin' | 'viewer';