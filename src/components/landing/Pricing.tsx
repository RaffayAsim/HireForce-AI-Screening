import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles, Zap, Shield, HelpCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UpgradeRequestModal } from "@/components/subscription/UpgradeRequestModal";
import { Badge } from "@/components/ui/badge";

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  priceUsd: string;
  pricePkr?: string;
  period: string;
  description: string;
  highlighted?: boolean;
  isFree?: boolean;
  screeningsLabel: string;
  jobsLabel: string;
  features: string[];
  ctaLabel: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "free-trial",
    name: "Free Trial",
    priceUsd: "$0",
    period: "10 Scans Included",
    description: "Experience AI-powered candidate screening with zero risk or card required.",
    isFree: true,
    screeningsLabel: "10 AI Candidate Screenings",
    jobsLabel: "Up to 3 Active Jobs",
    features: [
      "10 AI Candidate Screenings included",
      "Up to 3 Active Job Openings",
      "Automated Match Score (%) & AI Summary",
      "Interactive Candidate Pipeline Kanban",
      "Recruiter Email Outreach Preview",
      "Full Dashboard & Pipeline Access",
    ],
    ctaLabel: "Start Free Trial",
  },
  {
    id: "freelance-pro",
    name: "Freelance Pro",
    priceUsd: "$29",
    pricePkr: "₨ 8,500 / mo",
    period: "/ month",
    description: "Built for independent headhunters & solo freelance recruiters.",
    screeningsLabel: "1,000 AI Screenings / month",
    jobsLabel: "Unlimited Active Jobs",
    features: [
      "1,000 AI Screenings / mo (~25 full job campaigns)",
      "Unlimited Active Job Openings",
      "1 Connected Recruiter Mailbox (Gmail / Outlook)",
      "Automated Candidate Outreach & Follow-ups",
      "1-Click Google Meet & Teams Interview Links",
      "Candidate Pipeline & Stage Management",
      "Standard Email & In-App Support",
    ],
    ctaLabel: "Request Freelance Pro",
  },
  {
    id: "growth-hr",
    name: "Growth / In-House HR",
    badge: "Most Popular",
    priceUsd: "$69",
    pricePkr: "₨ 19,500 / mo",
    period: "/ month",
    description: "Best for growing companies, startups & multi-role HR departments.",
    highlighted: true,
    screeningsLabel: "4,000 AI Screenings / month",
    jobsLabel: "Unlimited Active Jobs",
    features: [
      "4,000 AI Screenings / mo (~80-100 high-volume jobs)",
      "Unlimited Active Job Openings",
      "Up to 3 Recruiter Team Seats",
      "Custom Candidate Screening & Knockout Criteria",
      "Priority AI Resume Evaluation Engine",
      "Automated 24h & 1h Interview Reminders",
      "Direct WhatsApp & Priority Support",
    ],
    ctaLabel: "Request Growth HR",
  },
  {
    id: "agency-unlimited",
    name: "Agency / Enterprise",
    priceUsd: "$149",
    pricePkr: "₨ 42,000 / mo",
    period: "/ month",
    description: "For staffing agencies, RPOs & high-volume enterprise hiring teams.",
    screeningsLabel: "Unlimited AI Screenings",
    jobsLabel: "Unlimited Active Jobs",
    features: [
      "Unlimited AI Candidate Screenings (Zero limits)",
      "Unlimited Active Job Openings",
      "Unlimited Recruiter Seats & Workspaces",
      "Custom Agency Branding & Multi-Client Tagging",
      "Dedicated Account Manager",
      "Fast-Track Activation & SLA Support",
    ],
    ctaLabel: "Request Agency Plan",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function Pricing() {
  const navigate = useNavigate();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("growth-hr");

  const handlePlanClick = (plan: PricingPlan) => {
    if (plan.isFree) {
      navigate("/trial");
    } else {
      setSelectedPlanId(plan.id);
      setUpgradeModalOpen(true);
    }
  };

  return (
    <section id="pricing" className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-zinc-950 text-white">
      {/* Background glow & subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base text-zinc-400 max-w-2xl mx-auto">
            Choose the package tailored to your applicant volume. Unlimited active jobs on all paid plans.
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch"
        >
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={cardVariants}
              className={`rounded-2xl flex flex-col justify-between transition-all duration-300 relative ${
                plan.highlighted
                  ? "bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-emerald-500/80 shadow-2xl shadow-emerald-950/40 lg:-translate-y-2"
                  : "bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:shadow-xl"
              }`}
            >
              {/* Highlight Ribbon */}
              {plan.highlighted && plan.badge && (
                <div className="py-1.5 px-4 text-center text-xs font-bold uppercase tracking-wider rounded-t-xl bg-emerald-500 text-zinc-950">
                  {plan.badge}
                </div>
              )}

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1.5">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mb-5 min-h-[32px]">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-4 pb-4 border-b border-zinc-800/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold text-white tracking-tight">{plan.priceUsd}</span>
                      <span className="text-xs text-zinc-400 font-medium">{plan.period}</span>
                    </div>
                    {plan.pricePkr && (
                      <div className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                        <span>{plan.pricePkr}</span>
                      </div>
                    )}
                  </div>

                  {/* Key Quota Pill */}
                  <div className="mb-5 p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs">
                    <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <Zap size={13} />
                      {plan.screeningsLabel}
                    </div>
                    <div className="text-zinc-400 text-[11px]">
                      {plan.jobsLabel}
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs text-zinc-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="text-emerald-400" size={11} />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action CTA Button */}
                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-auto ${
                    plan.highlighted
                      ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20"
                      : plan.isFree
                      ? "bg-white hover:bg-zinc-100 text-zinc-950 shadow"
                      : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 hover:border-emerald-500/50"
                  }`}
                >
                  <span>{plan.ctaLabel}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Upgrade Request Dialog */}
      <UpgradeRequestModal 
        open={upgradeModalOpen} 
        onOpenChange={setUpgradeModalOpen} 
        defaultPlanId={selectedPlanId} 
      />
    </section>
  );
}
