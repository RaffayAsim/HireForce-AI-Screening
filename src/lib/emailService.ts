export type EmailProvider = 'gmail' | 'outlook' | 'hostinger' | 'zoho' | 'smtp';

export interface EmailAccount {
  id: string;
  name: string;
  email: string;
  provider: EmailProvider;
  smtp_host: string;
  smtp_port: number;
  use_ssl: boolean;
  app_password?: string;
  is_default: boolean;
  connected_at: string;
}

export interface EmailMessage {
  id: string;
  sender: 'recruiter' | 'candidate';
  sender_name: string;
  sender_email: string;
  sent_at: string;
  content: string;
}

export interface EmailThread {
  id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  subject: string;
  from_account_id?: string;
  status: 'Sent' | 'Delivered' | 'Replied' | 'Not delivered';
  last_updated: string;
  messages: EmailMessage[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-interview',
    name: 'Interview Invitation',
    subject: 'Interview Invitation: {{job_title}} at HireForce',
    body: `Hi {{candidate_name}},

Thank you for applying for the {{job_title}} position. Our AI screening evaluation highlighted your strong background and qualifications.

We would love to invite you to a 30-minute virtual conversation to discuss your experience, learn more about your technical projects, and share details about our team roadmap.

Please let us know your availability over the next few business days, or confirm if the scheduled time works for you.

Best regards,
HireForce Recruitment Team`,
  },
  {
    id: 'tpl-high-match',
    name: 'Screening Passed (High Match)',
    subject: 'Exciting Update on your Application for {{job_title}}',
    body: `Dear {{candidate_name}},

Great news! Your application and resume for the {{job_title}} role completed automated evaluation with a top-tier screening score.

Our hiring team has advanced your profile to the Review stage. We are currently finalizing interview slots and will follow up with scheduling coordinates shortly.

Thank you for your interest in joining our mission.

Warmly,
Talent Acquisition Team`,
  },
  {
    id: 'tpl-offer',
    name: 'Offer & Next Steps',
    subject: 'Next Steps & Congratulations: {{job_title}}',
    body: `Dear {{candidate_name}},

Following our discussions and technical evaluations, we are thrilled to inform you that the team has unanimously recommended moving forward with an offer for {{job_title}}!

We are preparing your official offer documentation and look forward to welcoming you to the team.

Congratulations!
HireForce Leadership Team`,
  },
  {
    id: 'tpl-rejection',
    name: 'Polite Status Update',
    subject: 'Update regarding your application for {{job_title}}',
    body: `Dear {{candidate_name}},

Thank you for taking the time to apply for the {{job_title}} role and sharing your qualifications with us.

After careful review of all applicants, we have decided to proceed with candidates whose current skillsets more closely match the specific requirements of this position.

We truly appreciate your interest and wish you every success in your search.

Sincerely,
HireForce Talent Team`,
  },
];

const ACCOUNTS_STORAGE_KEY = 'hireforce_email_accounts';
const THREADS_STORAGE_KEY = 'hireforce_local_emails';

const getInitialAccounts = (): EmailAccount[] => {
  return [
    {
      id: 'acc-1',
      name: 'HireForce Recruiting (Default)',
      email: 'recruiting@hireforce.ai',
      provider: 'smtp',
      smtp_host: 'smtp.hireforce.ai',
      smtp_port: 587,
      use_ssl: true,
      app_password: '••••••••••••••••',
      is_default: true,
      connected_at: '2026-10-20T10:00:00Z',
    },
    {
      id: 'acc-2',
      name: 'Google Workspace Talent Pool',
      email: 'talent@quantumarc.us',
      provider: 'gmail',
      smtp_host: 'smtp.gmail.com',
      smtp_port: 465,
      use_ssl: true,
      app_password: '••••••••••••••••',
      is_default: false,
      connected_at: '2026-10-22T14:30:00Z',
    },
  ];
};

export const getEmailAccounts = (): EmailAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const clearAllEmailData = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([]));
  localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('local_email_accounts_updated'));
  window.dispatchEvent(new Event('local_emails_updated'));
};

export const saveEmailAccount = (account: Omit<EmailAccount, 'id' | 'connected_at'>): EmailAccount => {
  const accounts = getEmailAccounts();
  
  // If set to default, unset other defaults
  let updatedAccounts = accounts;
  if (account.is_default) {
    updatedAccounts = accounts.map(a => ({ ...a, is_default: false }));
  }

  const newAccount: EmailAccount = {
    ...account,
    id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    connected_at: new Date().toISOString(),
  };

  const finalAccounts = [newAccount, ...updatedAccounts];
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(finalAccounts));
  window.dispatchEvent(new Event('local_email_accounts_updated'));
  return newAccount;
};

export const deleteEmailAccount = (id: string) => {
  const accounts = getEmailAccounts().filter(a => a.id !== id);
  if (accounts.length > 0 && !accounts.some(a => a.is_default)) {
    accounts[0].is_default = true;
  }
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new Event('local_email_accounts_updated'));
};

export const setDefaultEmailAccount = (id: string) => {
  const accounts = getEmailAccounts().map(a => ({
    ...a,
    is_default: a.id === id,
  }));
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new Event('local_email_accounts_updated'));
};

const getInitialEmails = (): EmailThread[] => {
  return [
    {
      id: 'thread-1',
      candidate_id: 'be981bbc-63a5-4362-93b1-14f1a14a0f14',
      candidate_name: 'Abdul Raffay',
      candidate_email: 'candidate@example.com',
      job_title: 'AI Engineer',
      subject: 'Interview Invitation: AI Engineer at HireForce',
      status: 'Replied',
      last_updated: '2026-10-26T18:40:00Z',
      messages: [
        {
          id: 'msg-1',
          sender: 'recruiter',
          sender_name: 'HireForce Recruiter',
          sender_email: 'recruiting@hireforce.ai',
          sent_at: '2026-10-26T14:30:00Z',
          content: 'Hi Abdul, thank you for applying for the AI Engineer position. We would love to invite you to a technical evaluation call regarding your PyTorch and Python development portfolio.',
        },
        {
          id: 'msg-2',
          sender: 'candidate',
          sender_name: 'Abdul Raffay',
          sender_email: 'candidate@example.com',
          sent_at: '2026-10-26T18:40:00Z',
          content: 'Thank you for reaching out! Tomorrow at 2:00 PM works great for me. I look forward to speaking with the team.',
        },
      ],
    },
    {
      id: 'thread-2',
      candidate_id: 'd9ad1add-9760-4ca1-bb12-8ee81b01b4e7',
      candidate_name: 'Raffay Asim',
      candidate_email: 'raffaymusic@gmail.com',
      job_title: 'AI Automation Intern',
      subject: 'Application Received & Screening Underway',
      status: 'Sent',
      last_updated: '2026-10-25T11:15:00Z',
      messages: [
        {
          id: 'msg-3',
          sender: 'recruiter',
          sender_name: 'Talent Acquisition Team',
          sender_email: 'recruiting@hireforce.ai',
          sent_at: '2026-10-25T11:15:00Z',
          content: 'Hi Raffay, we received your application for the AI Automation Intern role. Our automated engine has logged your resume and scheduled an initial screening call.',
        },
      ],
    },
  ];
};

export const getEmails = (userId?: string): EmailThread[] => {
  if (typeof window === 'undefined') return [];
  try {
    const key = (userId && userId !== 'admin-001') ? `vision_email_threads_${userId}` : THREADS_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const sendEmail = (params: {
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  subject: string;
  content: string;
  from_account_id?: string;
}): EmailThread => {
  const threads = getEmails();
  const accounts = getEmailAccounts();
  const senderAccount = accounts.find(a => a.id === params.from_account_id) || accounts.find(a => a.is_default) || accounts[0];
  
  const existingIndex = threads.findIndex(t => t.candidate_id === params.candidate_id);
  
  const newMessage: EmailMessage = {
    id: `msg-${Date.now()}`,
    sender: 'recruiter',
    sender_name: senderAccount ? senderAccount.name : 'HireForce Recruiter',
    sender_email: senderAccount ? senderAccount.email : 'recruiting@hireforce.ai',
    sent_at: new Date().toISOString(),
    content: params.content,
  };

  if (existingIndex >= 0) {
    const thread = threads[existingIndex];
    thread.subject = params.subject;
    thread.from_account_id = senderAccount?.id;
    thread.status = 'Sent';
    thread.last_updated = new Date().toISOString();
    thread.messages.push(newMessage);
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
    window.dispatchEvent(new Event('local_emails_updated'));
    return thread;
  } else {
    const newThread: EmailThread = {
      id: `thread-${Date.now()}`,
      candidate_id: params.candidate_id,
      candidate_name: params.candidate_name,
      candidate_email: params.candidate_email,
      job_title: params.job_title,
      from_account_id: senderAccount?.id,
      subject: params.subject,
      status: 'Sent',
      last_updated: new Date().toISOString(),
      messages: [newMessage],
    };

    const updated = [newThread, ...threads];
    localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('local_emails_updated'));
    return newThread;
  }
};

export const replyToThread = (threadId: string, content: string, fromAccountId?: string): EmailThread | null => {
  const threads = getEmails();
  const thread = threads.find(t => t.id === threadId);
  if (!thread) return null;

  const accounts = getEmailAccounts();
  const senderAccount = accounts.find(a => a.id === fromAccountId) || accounts.find(a => a.is_default) || accounts[0];

  const newMessage: EmailMessage = {
    id: `msg-${Date.now()}`,
    sender: 'recruiter',
    sender_name: senderAccount ? senderAccount.name : 'HireForce Recruiter',
    sender_email: senderAccount ? senderAccount.email : 'recruiting@hireforce.ai',
    sent_at: new Date().toISOString(),
    content,
  };

  thread.messages.push(newMessage);
  thread.status = 'Sent';
  thread.last_updated = new Date().toISOString();

  localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event('local_emails_updated'));
  return thread;
};
