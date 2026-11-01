import React from "react";
import { ShieldCheck, Lock, Server, Key, EyeOff, CheckCircle2, ArrowLeft, Sparkles, Database } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function Security() {
  return (
    <div className="bg-[#FAFAFA] min-h-screen text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex-1">
        {/* Subtle Radial Dot-Grid & Ambient Diffuse Glow */}
        <div className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-20" />
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-emerald-400/15 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500 hover:text-[#046307] transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#046307] text-xs font-semibold tracking-wide mb-3">
              <ShieldCheck size={13} />
              <span>Enterprise Trust &amp; Infrastructure</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0A0A0A] tracking-tight leading-[1.15] mb-4">
              Security &amp; AI Compliance
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              How HireForce AI shields candidate resumes, protects recruiter email accounts, and enforces institutional-grade privacy standards.
            </p>
          </div>

          {/* 4 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="p-7 rounded-3xl bg-white border border-neutral-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#046307]">
                <Lock size={18} />
              </div>
              <h3 className="text-base font-bold text-[#0A0A0A]">AES-256 &amp; TLS 1.3 Encryption</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                All applicant resumes, evaluation scores, and database records are encrypted with AES-256 at rest and transmitted using modern TLS 1.3 cryptographic protocols.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-neutral-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#046307]">
                <EyeOff size={18} />
              </div>
              <h3 className="text-base font-bold text-[#0A0A0A]">Zero-Training Policy on Resumes</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Your applicant resumes and internal hiring criteria are never used to train public foundation models. Parsing and scoring occur in stateless, isolated compute environments.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-neutral-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#046307]">
                <Key size={18} />
              </div>
              <h3 className="text-base font-bold text-[#0A0A0A]">Minimal-Privilege OAuth 2.0</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Direct Gmail and Microsoft Outlook integrations utilize restricted OAuth 2.0 tokens strictly for sending interview invites and reading calendar availability.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-neutral-200/90 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-[#046307]">
                <Database size={18} />
              </div>
              <h3 className="text-base font-bold text-[#0A0A0A]">Strict Multi-Tenant Isolation</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Row-level database policies and cryptographic tenant identifiers guarantee that no applicant data or hiring pipeline information can ever leak across client boundaries.
              </p>
            </div>
          </div>

          {/* Compliance & Audit Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[#0A0A0A] text-white border border-neutral-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-40 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-xl font-bold mb-2">Need a Security Review or Enterprise DPA?</h3>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-6">
                Our infosec team regularly signs Data Processing Addendums (DPAs) and completes vendor security questionnaires for enterprise compliance reviews.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition"
              >
                <span>Request Enterprise Security Dossier</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

