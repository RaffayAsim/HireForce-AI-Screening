import { supabase } from './supabase';

// Tenant configuration
let tenantConfig: {
  n8nWebhookUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
} | null = null;

export const setTenantConfig = (config: typeof tenantConfig) => {
  tenantConfig = config;
};

const getN8NWebhookUrl = () => {
  return tenantConfig?.n8nWebhookUrl || import.meta.env.VITE_N8N_WEBHOOK_URL || '';
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
        });
      } catch (n8nError) {
        console.warn('⚠️ n8n webhook failed, but candidate was saved:', n8nError);
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
    const webhookUrl = `${getN8NWebhookUrl()}/${endpoint}`;
    console.log(`📤 Sending webhook to n8n: ${webhookUrl}`);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("❌ n8n Error:", error);
    throw error;
  }
};

// Export types
export type { Candidate, Job } from './supabase';