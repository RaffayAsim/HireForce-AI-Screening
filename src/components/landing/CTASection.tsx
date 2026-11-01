import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      navigate(`/trial?email=${encodeURIComponent(email.trim())}`);
    } else {
      navigate("/trial");
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] relative overflow-hidden text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Dot-Grid */}
      <div className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-20" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-[#0A0A0A] text-white p-8 sm:p-12 md:p-16 border border-emerald-500/30 shadow-[0_30px_90px_-20px_rgba(4,99,7,0.3)] relative overflow-hidden text-center"
        >
          {/* Subtle Ambient Emerald Aura */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/20 blur-[130px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-400/15 blur-[130px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold mb-6">
              <Sparkles size={13} />
              <span>Instant Setup • No Credit Card Required</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.12] mb-4 text-white">
              Ready to Automate Your{" "}
              <span className="font-serif italic font-normal bg-gradient-to-r from-emerald-400 to-[#34D399] bg-clip-text text-transparent">
                Hiring Pipeline?
              </span>
            </h2>

            {/* Subheadline */}
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
              Screen 30 to 50 applicant CVs in under a minute, automate candidate emails, and auto-book Google Meet rooms with zero manual back-and-forth.
            </p>

            {/* Short CTA Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto mb-6"
            >
              <div className="relative w-full">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email..."
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.08] border border-white/15 text-white placeholder-neutral-500 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#046307] to-[#10B981] hover:from-[#035205] hover:to-[#059669] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 hover:shadow-emerald-900/50 transition-all shrink-0 cursor-pointer"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={15} />
              </button>
            </form>

            {/* Value Checkmarks */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-neutral-400 font-medium">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                10 Free Scans Included
              </span>
              <span className="flex items-center gap-1.5 text-neutral-300">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                Soft Pause Guarantee
              </span>
              <span className="flex items-center gap-1.5 text-neutral-300">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                2-Minute Onboarding
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

