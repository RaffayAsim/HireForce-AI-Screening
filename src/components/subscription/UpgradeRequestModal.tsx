import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Check, 
  Send, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Phone, 
  User, 
  Loader2, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/authHeader';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

export interface UpgradePlanOption {
  id: string;
  name: string;
  badge?: string;
  priceUsd: string;
  pricePkr: string;
  tagline: string;
  screenings: string;
  jobs: string;
  seats: string;
  features: string[];
}

export const PRICING_TIERS: UpgradePlanOption[] = [
  {
    id: 'freelance-pro',
    name: 'Freelance Pro',
    priceUsd: '$29',
    pricePkr: '₨ 8,500',
    tagline: 'Ideal for independent headhunters & freelance recruiters',
    jobs: 'Unlimited Active Jobs',
    screenings: '1,000 AI Candidate Screenings / month',
    seats: '1 Recruiter Account',
    features: [
      '1,000 AI Candidate Screenings / month (Covers ~20-25 full job campaigns)',
      'Unlimited Active Job Openings',
      '1 Connected Recruiter Mailbox (Gmail / Outlook)',
      'Automated Candidate Outreach & Follow-ups',
      '1-Click Google Meet & Microsoft Teams Rooms',
      'Candidate Pipeline & Stage Management',
      'Standard Email & In-App Support',
    ]
  },
  {
    id: 'growth-hr',
    name: 'Growth / In-House HR',
    badge: 'Most Popular',
    priceUsd: '$69',
    pricePkr: '₨ 19,500',
    tagline: 'Best for startups, tech companies & growing HR teams',
    jobs: 'Unlimited Active Jobs',
    screenings: '4,000 AI Candidate Screenings / month',
    seats: 'Up to 3 Recruiter Seats',
    features: [
      '4,000 AI Candidate Screenings / month (Covers ~80-100 high-volume jobs)',
      'Unlimited Active Job Openings',
      'Up to 3 Recruiter Seats',
      'Custom Candidate Screening & Knockout Criteria',
      'Priority AI Resume Evaluation Engine',
      'Automated 24h & 1h Interview Reminders',
      'Direct WhatsApp & Priority Support',
    ]
  },
  {
    id: 'agency-unlimited',
    name: 'Agency / Enterprise',
    priceUsd: '$149',
    pricePkr: '₨ 42,000',
    tagline: 'For staffing agencies & high-volume enterprise hiring',
    jobs: 'Unlimited Active Jobs',
    screenings: 'Unlimited AI Screenings',
    seats: 'Unlimited Team Seats',
    features: [
      'Unlimited AI Candidate Screenings (Zero limits)',
      'Unlimited Active Job Openings',
      'Unlimited Recruiter Seats & Workspaces',
      'Custom Agency Branding & Multi-Client Tagging',
      'Dedicated Account Manager',
      'Fast-Track Activation & SLA Support',
    ]
  }
];

interface UpgradeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlanId?: string;
}

export const UpgradeRequestModal: React.FC<UpgradeRequestModalProps> = ({
  open,
  onOpenChange,
  defaultPlanId = 'growth-hr'
}) => {
  const { user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlanId);
  const [fullName, setFullName] = useState(() => user?.fullName || '');
  const [email, setEmail] = useState(() => user?.email || user?.username || '');
  const [phone, setPhone] = useState(() => user?.phone || '');
  const [companyName, setCompanyName] = useState(() => user?.companyName || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedPlan = PRICING_TIERS.find(p => p.id === selectedPlanId) || PRICING_TIERS[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);

    const upgradeMessage = `New Plan Upgrade Request Received:

• Customer Full Name: ${fullName.trim() || 'Recruiter'}
• Contact Email: ${email.trim()}
• Phone / WhatsApp: ${phone.trim() || 'Not specified'}
• Company / Agency: ${companyName.trim() || 'Company'}
• Requested Subscription Plan: ${selectedPlan.name}
• Pricing: ${selectedPlan.priceUsd} / month (${selectedPlan.pricePkr} / month)
• Included Monthly AI Screenings: ${selectedPlan.screenings}
• Jobs Allowance: ${selectedPlan.jobs}
• Current User ID: ${user?.id || 'trial_user'}
• Current Usage: ${user?.usageCount || 0} screenings / ${user?.jobCount || 0} jobs
• Client Requirements / Notes: ${notes.trim() || 'None provided'}
• Submitted At: ${new Date().toLocaleString()}

Next Steps:
Please follow up with the customer via WhatsApp/phone or email to confirm invoice or bank transfer payment details, then upgrade their account tier.`;

    try {
      // 1. Dispatch notification email to platform owner
      await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(user?.id)
        },
        body: JSON.stringify({
          to: 'angellagarland13yv61@gmail.com',
          subject: `🚀 Plan Upgrade Request: ${companyName.trim() || 'Client'} (${selectedPlan.name})`,
          content: upgradeMessage,
          userId: user?.id,
        })
      }).catch(() => {});

      // 2. Also log locally in pending upgrade requests
      try {
        const raw = localStorage.getItem('hireforce_upgrade_requests') || '[]';
        const requests = JSON.parse(raw);
        requests.unshift({
          id: `req-${Date.now()}`,
          fullName,
          email,
          phone,
          companyName,
          plan: selectedPlan.name,
          price: selectedPlan.pricePkr,
          notes,
          submittedAt: new Date().toISOString()
        });
        localStorage.setItem('hireforce_upgrade_requests', JSON.stringify(requests));
      } catch {}

      setIsSubmitted(true);
      showSuccess('Upgrade request submitted successfully!');
    } catch (err: any) {
      console.warn('Upgrade request dispatch warning:', err);
      setIsSubmitted(true);
      showSuccess('Upgrade request received!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white border border-zinc-200 shadow-2xl rounded-2xl p-6 max-h-[92vh] overflow-y-auto">
        {isSubmitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Upgrade Request Received!</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
                Thank you for choosing <strong>{selectedPlan.name}</strong>. Our team will contact you at <strong>{phone || email}</strong> shortly to confirm payment details and activate your subscription.
              </p>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/90 text-left text-xs space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-zinc-500">Selected Plan:</span>
                <span className="font-bold text-zinc-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Monthly Investment:</span>
                <span className="font-bold text-emerald-700">{selectedPlan.pricePkr} / month ({selectedPlan.priceUsd})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">AI Screenings:</span>
                <span className="font-semibold text-zinc-800">{selectedPlan.screenings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Contact Email:</span>
                <span className="font-mono text-zinc-800">{email}</span>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-6 h-9"
            >
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader className="text-left space-y-1 pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center shadow-2xs">
                  <Sparkles size={16} />
                </div>
                <DialogTitle className="text-lg font-bold text-zinc-900">
                  Upgrade Your HireForce Plan
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-zinc-500">
                Unlock high-volume candidate resume screening, unlimited jobs, and automated recruitment workflows.
              </DialogDescription>
            </DialogHeader>

            {/* Plan Cards Grid */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-zinc-700">Choose Subscription Plan:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PRICING_TIERS.map((tier) => {
                  const isSelected = selectedPlanId === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedPlanId(tier.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between relative",
                        isSelected 
                          ? "bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs" 
                          : "bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
                      )}
                    >
                      {tier.badge && (
                        <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-2xs">
                          {tier.badge}
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-zinc-900">{tier.name}</h4>
                          <span className={cn(
                            "w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0",
                            isSelected ? "border-emerald-600 bg-emerald-600" : "border-zinc-300"
                          )}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-base font-extrabold text-zinc-900">{tier.pricePkr}</span>
                          <span className="text-[10px] text-zinc-400">/mo</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 block">({tier.priceUsd} USD)</span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-zinc-100 space-y-1">
                        <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                          <Check size={12} className="text-emerald-600 shrink-0" />
                          <span>{tier.screenings}</span>
                        </div>
                        <div className="text-[10px] text-zinc-600 flex items-center gap-1">
                          <Check size={11} className="text-zinc-400 shrink-0" />
                          <span>{tier.jobs}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recruiter Contact Information */}
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-3">
              <span className="text-[11px] font-bold text-zinc-700 block uppercase tracking-wider">
                Recruiter Contact Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-600 font-semibold">Full Name *</Label>
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Jane Doe"
                    className="h-8.5 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-600 font-semibold">Email Address *</Label>
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. jane@company.com"
                    className="h-8.5 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-600 font-semibold">Phone / WhatsApp *</Label>
                  <Input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+92 300 0000000"
                    className="h-8.5 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-600 font-semibold">Company / Agency Name</Label>
                  <Input 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp or Talent Agency"
                    className="h-8.5 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-600 font-semibold">Requirements / Notes (Optional)</Label>
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Need custom billing, extra seats, or specific integration assistance?"
                  className="min-h-[55px] text-xs bg-white resize-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 border-t border-zinc-100 flex items-center justify-between sm:justify-between">
              <span className="text-[11px] text-zinc-400">
                Manual activation via direct invoice / bank transfer
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !email.trim() || !phone.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 h-9 gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {isSubmitting ? 'Sending Request...' : 'Submit Upgrade Request'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeRequestModal;
