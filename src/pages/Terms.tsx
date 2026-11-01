import React from "react";
import { ShieldCheck, FileText, ArrowLeft, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function Terms() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex-1">
        {/* Subtle Radial Dot-Grid & Ambient Diffuse Glow */}
        <div className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-20" />
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-emerald-400/15 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-[#046307] transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#046307] text-xs font-semibold tracking-wide mb-3">
              <FileText size={13} />
              <span>Platform Service Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0A0A0A] tracking-tight leading-[1.15] mb-3">
              Terms of Service
            </h1>
            <p className="text-xs text-neutral-500 font-mono">
              Last Updated: January 1, 2026 • Version 2.2
            </p>
          </div>

          {/* Document Content Card */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-neutral-200/90 shadow-sm space-y-8 text-sm text-neutral-700 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0A0A0A] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account or accessing the services provided by HireForce AI (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a recruitment firm or corporate employer, you represent that you have the authority to bind such entity.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0A0A0A] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                2. Free Trial &amp; Soft Pause Guarantee
              </h2>
              <p>
                Every new organization is entitled to 10 complimentary AI candidate screenings and up to 10 active job postings. When your scan allotment finishes:
              </p>
              <ul className="space-y-2 pl-4 text-xs text-neutral-600">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>You will <strong>never</strong> be locked out of your candidate database or existing pipeline records.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>New automated parsing and automated interview email triggers will enter a soft pause until an upgrade request is approved.</span>
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0A0A0A] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                3. Subscriptions &amp; Billing Activation
              </h2>
              <p>
                Paid tiers (Freelance Pro, Growth HR, and Agency Enterprise) provide monthly quotas of candidate screenings. Upgrades can be requested directly inside the dashboard or pricing table. Invoicing is processed via secure card payment, bank transfer, or corporate invoice, and accounts are activated within hours upon payment confirmation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0A0A0A] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                4. Recruiter Responsibility &amp; Acceptable Use
              </h2>
              <p>
                You agree not to use HireForce AI for sending unsolicited bulk spam, scraping deceptive resumes, or violating applicable fair labor and non-discrimination hiring laws. The recruiter remains the ultimate decision-maker for all hiring, shortlisting, and rejection actions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#0A0A0A] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                5. Agency &amp; Multi-Client Usage
              </h2>
              <p>
                Staffing agencies and independent headhunters on eligible plans may represent multiple client brands across individual job campaigns. You are responsible for ensuring you have lawful authorization to solicit candidates on behalf of your respective client entities.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-neutral-100">
              <h2 className="text-lg font-bold text-[#0A0A0A] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                6. Questions &amp; Legal Notices
              </h2>
              <p>
                For questions regarding licensing agreements, custom MSAs, or enterprise SLA inquiries, please email our legal counsel at:
              </p>
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono text-neutral-800">
                Email: legal@hireforce.ai • Attention: Legal Counsel
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

