import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle, ChevronDown } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
  category: "Billing & Plans" | "AI Screening" | "Integrations";
}

const faqs: FAQItem[] = [
  {
    category: "Billing & Plans",
    q: "What happens when my free trial candidate limit finishes?",
    a: "You are never locked out of your account! Your candidate database, resumes, interview notes, and email history remain 100% accessible. Only new automated AI screenings and automated drip emails pause until you upgrade to a paid plan.",
  },
  {
    category: "AI Screening",
    q: "How many applicants does a single job typically receive?",
    a: "In regional and high-volume hiring markets, an active job posting typically receives 30 to 50 applicant resumes. Our Freelance Pro plan (1,000 screenings/mo) and Growth plan (4,000 screenings/mo) ensure you can screen dozens of positions with peace of mind.",
  },
  {
    category: "Integrations",
    q: "Can I use HireForce for multiple different client companies?",
    a: "Yes! When creating each job posting, you can specify the Client / Company Name. Candidate confirmation emails, interview invites, and Google Meet rooms will dynamically display the client's brand instead of your agency name.",
  },
  {
    category: "Billing & Plans",
    q: "How does plan activation work?",
    a: "Click 'Request Upgrade' on any tier to submit your contact details. Our team immediately receives your request via email and WhatsApp to coordinate bank transfer, card, or invoice payment and activates your plan within hours.",
  },
  {
    category: "AI Screening",
    q: "How accurate is the AI resume screening engine?",
    a: "Our multi-agent AI evaluates each applicant against your exact job description, experience requirements, and mandatory knockout criteria. It delivers a 0-100% fit score and an executive qualification summary highlighting verified strengths and gaps.",
  },
  {
    category: "Integrations",
    q: "Do emails come from HireForce or my own email address?",
    a: "All candidate emails and calendar invitations are sent directly through your connected Gmail or Outlook mailbox via secure OAuth. Candidates reply straight to your personal or company inbox with zero third-party spoofing.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] border-t border-neutral-200/80 relative overflow-hidden text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900"
    >
      {/* Background Dot-Grid & Ambient Diffuse Emerald Lighting */}
      <div className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-20" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-emerald-400/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0A0A0A] tracking-tight leading-[1.14] mb-3"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-neutral-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto"
          >
            Everything in-house recruiters and staffing agencies need to know about plans, quotas, and automated workflows.
          </motion.p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`rounded-2xl transition-all duration-300 border ${
                  isOpen
                    ? "bg-white border-emerald-500/60 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                    : "bg-white/80 backdrop-blur-md border-neutral-200/90 hover:border-neutral-300 hover:bg-white shadow-2xs"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 cursor-pointer focus:outline-hidden"
                >
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md mt-0.5 shrink-0 transition-colors ${
                        isOpen
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                          : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                      }`}
                    >
                      {faq.category}
                    </span>
                    <h3
                      className={`text-sm sm:text-base font-bold transition-colors ${
                        isOpen ? "text-[#0A0A0A]" : "text-neutral-800"
                      }`}
                    >
                      {faq.q}
                    </h3>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isOpen
                        ? "bg-emerald-500 text-white shadow-xs rotate-180"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <ChevronDown size={16} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 pl-14">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

