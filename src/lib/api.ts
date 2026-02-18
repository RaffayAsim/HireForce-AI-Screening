import { supabase } from './supabase';

// Tenant configuration
let tenantConfig: {
  n8nWebhookUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
} | null = null;

// Master API config as fallback
const MASTER_CONFIG = {
  n8nWebhookUrl: 'https://jamesy982.app.n8n.cloud/webhook/resume-screening',
  supabaseUrl: 'https://sziksecdqwwvnmuxjiim.supabase.co',
  supabaseKey: 'sb_publishable_aB2yXeG8m0KjDLZbpr8Wpg_ndKoRxKa',
};

export const setTenantConfig = (config: typeof tenantConfig) => {
  tenantConfig = config;
  console.log('✅ Tenant config set:', config);
};

const getN8NWebhookUrl = () => {
  const url = tenantConfig?.n8nWebhookUrl || MASTER_CONFIG.n8nWebhookUrl || import.meta.env.VITE_N8N_WEBHOOK_URL || '';
  console.log('🔗 Using n8n webhook URL:', url);
  return url;
};

// Job API functions
export const createJobInSupabase = async (data: any) => {
  try {
    const { data: newRecord, error } = await supabase
      .from('jobs')
      .insert([{
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        location: data.location,
        department: data.department,
        salary: data.salary,
        status: 'Active',
      }])
      .select()
      .single();

    if (error) throw error;
    return newRecord;
  } catch (error) {
    console.error('❌ Error creating job:', error);
    throw error;
  }
};

export const fetchJobById = async (jobId: string) => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching job:', error);
    throw error;
  }
};

export const subscribeToJobs = (callback: (jobs: any[]) => void) => {
  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return;
    }
    callback(data || []);
  };

  fetchJobs();

  const subscription = supabase
    .channel('jobs-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
      fetchJobs();
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Candidate API functions
export const subscribeToCandidates = (callback: (candidates: any[]) => void) => {
  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching candidates:', error);
      return;
    }
    callback(data || []);
  };

  fetchCandidates();

  const subscription = supabase
    .channel('candidates-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, () => {
      fetchCandidates();
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

export const createCandidateApplication = async (data: any) => {
  try {
    let resumeUrl = null;

    // Upload resume if provided
    if (data.resume_file) {
      const fileExt = data.resume_file.name.split('.').pop();
      const fileName = `${data.name}-${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, data.resume_file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      resumeUrl = publicUrlData.publicUrl;
    }

    // Create candidate record
    const { data: newCandidate, error } = await supabase
      .from('candidates')
      .insert([{
        full_name: data.name,
        email: data.email,
        phone: data.phone,
        linkedin: data.linkedin,
        job_id: data.job_id,
        resume_url: resumeUrl,
        status: 'new',
      }])
      .select()
      .single();

    if (error) throw error;

    // Send to n8n for AI screening
    if (resumeUrl) {
      try {
        await sendToN8n('resume-screening', {
          candidateId: newCandidate.id,
          jobId: data.job_id,
          resumeUrl: resumeUrl,
          candidateName: data.name,
          candidateEmail: data.email,
          jobTitle: data.jobTitle || 'Unknown Position',
        });
        console.log('✅ Webhook sent successfully for candidate:', newCandidate.id);
      } catch (n8nError) {
        console.warn('⚠️ n8n webhook failed, but candidate was saved:', n8nError);
        // Don't throw - candidate is already saved
      }
    }

    return newCandidate;
  } catch (error) {
    console.error('❌ Error creating candidate:', error);
    throw error;
  }
};

// n8n Webhook function
export const sendToN8n = async (endpoint: string, data: any) => {
  try {
    const baseUrl = getN8NWebhookUrl();
    
    if (!baseUrl) {
      throw new Error('n8n Webhook URL not configured. Check tenant config.');
    }
    
    // If the URL already ends with /resume-screening, use it directly
    // Otherwise append the endpoint
    const webhookUrl = baseUrl.includes('/resume-screening') ? baseUrl : `${baseUrl}/${endpoint}`;
    console.log(`📤 Sending webhook to n8n: ${webhookUrl}`);
    console.log(`📊 Payload:`, JSON.stringify(data, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data),
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ n8n HTTP Error: ${response.status}`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ n8n Success:`, result);
    return result;
  } catch (error) {
    console.error("❌ n8n Webhook Error:", error);
    throw error;
  }
};

// Export types
export type { Candidate, Job } from './supabase';