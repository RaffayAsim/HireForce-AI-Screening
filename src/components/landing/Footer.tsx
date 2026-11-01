import React from "react";
import { Sparkles, ArrowUp, ArrowRight, Zap, ShieldCheck, Mail, Video, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const featurePills = [
    { icon: Zap, label: "50 CVs in <60 Seconds" },
    { icon: CheckCircle2, label: "Knockout Criteria Gate" },
    { icon: Mail, label: "Gmail & Outlook Direct Drips" },
    { icon: Video, label: "1-Click Meeting Rooms" },
    { icon: ShieldCheck, label: "Soft Pause Guarantee" },
  ];

  return (
    <footer className="bg-[#0A0A0A] text-neutral-300 border-t border-neutral-800/80 relative overflow-hidden font-sans">
      {/* Subtle Ambient Diffuse Emerald Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[180px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        {/* Top Feature Highlights Bar */}
        <div className="mb-14 pb-10 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {featurePills.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-emerald-500/30 text-neutral-300 text-xs font-mono flex items-center gap-2 transition-colors"
                >
                  <Icon size={13} className="text-emerald-400" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          <Link
            to="/trial"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
          >
            <span>Start 10 Free Scans</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {/* 4 Categorical Navigation Tabs/Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">
          {/* Brand Info (4 Columns on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <BrandLogo size="md" theme="dark" />

            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              The autonomous candidate screening and communication engine for in-house HR leaders and independent staffing recruiters. Evaluate 50 CVs in seconds and schedule interviews automatically.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Tab 1: Product Navigation (3 Columns on lg) */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Platform Solutions</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <a href="#dashboard" className="hover:text-emerald-400 transition-colors">
                  The Recruiter Workspace
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-emerald-400 transition-colors">
                  AI Screening &amp; Match Scoring
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
                  Email &amp; Calendar Flow
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-emerald-400 transition-colors">
                  Pricing Packages
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-emerald-400 transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>

          {/* Tab 2: Subscription Plans (2 Columns on lg) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Plans &amp; Quotas</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <a href="#pricing" className="hover:text-emerald-400 transition-colors">
                  Free Trial (10 Scans)
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-emerald-400 transition-colors">
                  Freelance Pro (1,000/mo)
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-emerald-400 transition-colors">
                  Growth HR (4,000/mo)
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-emerald-400 transition-colors">
                  Agency Enterprise
                </a>
              </li>
            </ul>
          </div>

          {/* Tab 3: Portal Access & Compliance (3 Columns on lg) */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-4 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Recruiter Portal</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-neutral-400">
              <li>
                <Link
                  to="/trial"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1"
                >
                  Start Free Trial (10 Scans)
                  <ArrowRight size={11} />
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Recruiter Sign In
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Candidate Pipeline Kanban
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-neutral-300 transition-colors">
                  Security &amp; AI Compliance
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-neutral-300 transition-colors">
                  Data Protection &amp; Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Executive Architecture Credit, Back to Top */}
        <div className="pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span>© 2026 HireForce AI. All rights reserved.</span>
          </div>

          <div className="text-center">
            Platform Architecture &amp; Engineering by{" "}
            <a
              href="https://www.linkedin.com/in/raffay-asim-52bb92247/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-emerald-400 font-semibold transition-colors underline decoration-emerald-500/50 underline-offset-4"
            >
              Raffay Asim
            </a>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
}
