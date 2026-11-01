import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Phone, Calendar, CheckCircle2, ArrowRight, Sparkles, Building, Send } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    hiringVolume: "100 - 500 CVs / mo",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        title: "Inquiry Received",
        description: "A recruitment specialist will contact you within 2 hours.",
      });
    }, 800);
  };

  return (
    <div className="bg-[#FAFAFA] min-h-screen text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex-1">
        {/* Subtle Radial Dot-Grid & Ambient Diffuse Glow */}
        <div className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-20" />
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-emerald-400/15 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#046307] text-xs font-semibold tracking-wide mb-4"
            >
              <Sparkles size={13} />
              <span>Dedicated Recruiter Advisory</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0A0A0A] tracking-tight leading-[1.12] mb-4"
            >
              Let’s Accelerate Your{" "}
              <span className="font-serif italic font-normal bg-gradient-to-r from-[#046307] via-[#059669] to-[#10B981] bg-clip-text text-transparent">
                Hiring Velocity
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-neutral-600 text-base max-w-2xl mx-auto leading-relaxed"
            >
              Have questions about multi-client agency setups, candidate limits, or custom ATS integrations? Our platform architects are ready to assist.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-5xl mx-auto">
            {/* Left 5 Cols: Contact Channels */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-4">
                <h3 className="text-lg font-bold text-[#0A0A0A]">Direct Support Channels</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Connect with our team for priority onboarding, enterprise custom quotes, and technical walkthroughs.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/70">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#046307]">
                      <Mail size={16} />
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500 font-mono">Email Support</div>
                      <a
                        href="mailto:support@hireforce.ai"
                        className="text-xs font-semibold text-[#0A0A0A] hover:text-[#046307] transition-colors"
                      >
                        support@hireforce.ai
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/70">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#046307]">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500 font-mono">WhatsApp Priority Desk</div>
                      <span className="text-xs font-semibold text-[#0A0A0A]">
                        +1 (800) 447-3367
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/70">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#046307]">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-500 font-mono">Live Demo Booking</div>
                      <span className="text-xs font-semibold text-[#0A0A0A]">
                        15-Min Virtual Tour
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Pill */}
              <div className="p-5 rounded-2xl bg-[#0A0A0A] text-white border border-neutral-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div className="text-xs leading-relaxed text-neutral-300">
                  <strong className="text-white">Confidential Assessment:</strong> Your job specs and candidate volume remain strictly protected under NDA.
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Inquiry Form */}
            <div className="lg:col-span-7">
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-neutral-200/90 shadow-lg shadow-neutral-200/50">
                {isSubmitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#046307] mx-auto shadow-xs">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-[#0A0A0A]">Thank You for Reaching Out!</h3>
                    <p className="text-sm text-neutral-600 max-w-md mx-auto leading-relaxed">
                      Your inquiry has been routed to our enterprise recruiting advisors. Expect a tailored response or meeting confirmation shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSubmitted(false)}
                      className="px-6 py-2.5 rounded-full bg-[#0A0A0A] text-white text-xs font-bold hover:bg-neutral-800 transition"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Alex Henderson"
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                          Work Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                          Company / Staffing Agency
                        </label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="e.g. Nexus Talent Corp"
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                          Estimated Monthly Candidate Volume
                        </label>
                        <select
                          value={formData.hiringVolume}
                          onChange={(e) => setFormData({ ...formData, hiringVolume: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition cursor-pointer"
                        >
                          <option>50 - 200 CVs / mo</option>
                          <option>200 - 1,000 CVs / mo</option>
                          <option>1,000 - 5,000 CVs / mo</option>
                          <option>5,000+ CVs / mo (Enterprise Unlimited)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        How can we help your team? *
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Tell us about your current screening bottlenecks, active roles, or requested custom integrations..."
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Sending Request...</span>
                      ) : (
                        <>
                          <span>Submit Inquiry to Recruiter Advisory</span>
                          <Send size={14} className="text-emerald-400" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

