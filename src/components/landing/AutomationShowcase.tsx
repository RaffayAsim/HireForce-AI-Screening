import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  CalendarCheck,
  BellRing,
  Check,
  Video,
  Clock,
  ExternalLink,
  ShieldCheck,
  Mail,
  Zap,
} from "lucide-react";

interface StepNodeData {
  step: string;
  stepNum: number;
  icon: React.ElementType;
  title: string;
  copy: string;
}

const timelineNodes: StepNodeData[] = [
  {
    step: "STEP 01",
    stepNum: 1,
    icon: Send,
    title: "Application Confirmation Dispatched",
    copy: "Immediately upon resume upload, the applicant receives a branded confirmation from your mailbox.",
  },
  {
    step: "STEP 02",
    stepNum: 2,
    icon: Sparkles,
    title: "AI Resume Screening & Qualification Scoring",
    copy: "Evaluates technical fit, experience, and knockout criteria to generate a match score & summary.",
  },
  {
    step: "STEP 03",
    stepNum: 3,
    icon: CalendarCheck,
    title: "Interview Scheduled with Google Meet Room",
    copy: "Shortlisted candidates receive a personalized invite with an auto-generated Google Meet room.",
  },
  {
    step: "STEP 04",
    stepNum: 4,
    icon: BellRing,
    title: "24-Hour & 1-Hour Dual Reminders",
    copy: "Recruiters and candidates receive automated reminders 24h and 1h before the interview to prevent no-shows.",
  },
];

export default function AutomationShowcase() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3582); // ~59m 42s

  // Choreographed 12-second autonomous loop (3 seconds per step across Steps 01 to 04)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Live countdown timer for Card 04
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `00:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <section
      id="how-it-works"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] border-t border-neutral-200/80 relative overflow-hidden selection:bg-emerald-100 selection:text-emerald-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Dot-Grid & Ambient Diffuse Emerald Lighting */}
      <div className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-20" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[350px] bg-emerald-400/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[950px] h-[380px] bg-emerald-500/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ============================================================== */}
        {/* SECTION HEADER & CONNECTED STATUS STRIP                        */}
        {/* ============================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Main Headline - Clean, distinct solid obsidian typography (no hero clone) */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0A0A0A] tracking-tight leading-[1.15] mb-3"
          >
            Automated Email &amp; Calendar Scheduling
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-neutral-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto"
          >
            From the moment a candidate applies to the final interview reminder, every email is delivered automatically from your connected recruiter mailbox via Gmail, Outlook &amp; Google Meet.
          </motion.p>

          {/* Connected Integration Strip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 px-5 py-2.5 mt-6 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200/90 shadow-sm text-xs font-medium text-neutral-700"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-neutral-900 font-semibold">Gmail</span>
              <span className="text-emerald-700 font-medium">Connected</span>
            </div>

            <span className="text-neutral-300 hidden sm:inline">•</span>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-neutral-900 font-semibold">Outlook</span>
              <span className="text-emerald-700 font-medium">Active</span>
            </div>

            <span className="text-neutral-300 hidden sm:inline">•</span>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-neutral-900 font-semibold">Google Meet</span>
              <span className="text-emerald-700 font-medium">Ready</span>
            </div>
          </motion.div>
        </div>

        {/* ============================================================== */}
        {/* DESKTOP SPLIT-TRACK (Top Track -> Laser Bridges -> Bottom Track)*/}
        {/* ============================================================== */}
        <div className="hidden lg:block relative mt-10">
          {/* TRACK 1: Horizontal Fiber-Optic Trigger Timeline */}
          <div className="relative">
            {/* Horizontal SVG Fiber-Optic Line behind nodes */}
            <div className="absolute top-[42px] left-[6%] right-[6%] h-[2px] bg-emerald-500/15 z-0">
              {/* Dynamic Traveling Glowing Energy Beam */}
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-[#10B981] to-[#34D399] shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                animate={{
                  width: `${((activeStep + 1) / 4) * 100}%`,
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
            </div>

            {/* 4 Clickable Trigger Nodes */}
            <div className="grid grid-cols-4 gap-6 relative z-10">
              {timelineNodes.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeStep === idx;
                const isPassed = activeStep > idx;

                return (
                  <motion.div
                    key={item.step}
                    onClick={() => {
                      setActiveStep(idx);
                      setIsPaused(true);
                    }}
                    className={`rounded-2xl p-5 cursor-pointer transition-all duration-400 relative backdrop-blur-xl border ${
                      isActive
                        ? "bg-white/95 border-emerald-500 shadow-[0_15px_35px_-10px_rgba(16,185,129,0.28)] ring-1 ring-emerald-500/50"
                        : "bg-white/80 border-neutral-200/80 hover:border-emerald-500/40 hover:bg-white/90 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3.5">
                      {/* Icon Circle */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-br from-[#046307] to-[#10B981] text-white shadow-md shadow-emerald-500/30 scale-105"
                            : isPassed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Step Tag */}
                      <span
                        className={`text-[11px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md ${
                          isActive
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                            : "text-neutral-400 bg-neutral-100"
                        }`}
                      >
                        {item.step}
                      </span>
                    </div>

                    <h4
                      className={`text-sm font-bold tracking-tight mb-1.5 transition-colors ${
                        isActive ? "text-[#0A0A0A]" : "text-neutral-700"
                      }`}
                    >
                      {item.title}
                    </h4>

                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">
                      {item.copy}
                    </p>

                    {/* Active Step Progress Pill Bar */}
                    {isActive && (
                      <motion.div
                        layoutId="activeStepIndicator"
                        className="absolute bottom-0 left-4 right-4 h-[3px] bg-gradient-to-r from-[#046307] to-[#10B981] rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* VERTICAL SVG LASER BRIDGES (Top Track -> Bottom Track) */}
          <div className="grid grid-cols-4 gap-6 my-2 relative z-10">
            {timelineNodes.map((_, idx) => {
              const isActive = activeStep === idx;
              return (
                <div key={idx} className="h-12 flex justify-center items-center relative">
                  {/* Base Track */}
                  <div className="w-[2px] h-full bg-emerald-500/15 relative overflow-hidden">
                    {/* Animated Vertical Emerald Laser Beam */}
                    {isActive && (
                      <motion.div
                        className="w-full h-8 bg-gradient-to-b from-[#10B981] via-[#34D399] to-transparent shadow-[0_0_10px_#10B981]"
                        animate={{ y: ["-100%", "150%"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.1,
                          ease: "linear",
                        }}
                      />
                    )}
                  </div>
                  {/* Subtle Node Connector Dot */}
                  <div
                    className={`absolute bottom-0 w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-emerald-400 shadow-[0_0_8px_#10B981] scale-125"
                        : "bg-neutral-300"
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* TRACK 2: Synchronized Obsidian Black Artifact Cards with 3D Elevation */}
          <div className="grid grid-cols-4 gap-6 items-stretch relative z-10">
            {/* Artifact Card 01: Application Received */}
            <ObsidianCard01 isActive={activeStep === 0} onSelect={() => setActiveStep(0)} />

            {/* Artifact Card 02: AI Qualification Scoring Verdict */}
            <ObsidianCard02 isActive={activeStep === 1} onSelect={() => setActiveStep(1)} />

            {/* Artifact Card 03: Interview Invitation + Meet Popover */}
            <ObsidianCard03 isActive={activeStep === 2} onSelect={() => setActiveStep(2)} />

            {/* Artifact Card 04: 24h & 1h Dual Reminders */}
            <ObsidianCard04
              isActive={activeStep === 3}
              onSelect={() => setActiveStep(3)}
              countdown={formatCountdown(countdownSeconds)}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE / TABLET DISPLAY (< 1024px: Paired Node -> Laser -> Card)*/}
        {/* ============================================================== */}
        <div className="lg:hidden space-y-8 mt-10">
          {/* Card 01 Pair */}
          <div className="space-y-3">
            <MobileStepTrigger
              data={timelineNodes[0]}
              isActive={activeStep === 0}
              onClick={() => setActiveStep(0)}
            />
            <div className="h-7 w-[2px] mx-auto bg-emerald-500/20 relative overflow-hidden">
              {activeStep === 0 && (
                <div className="w-full h-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <ObsidianCard01 isActive={activeStep === 0} onSelect={() => setActiveStep(0)} />
          </div>

          {/* Card 02 Pair */}
          <div className="space-y-3">
            <MobileStepTrigger
              data={timelineNodes[1]}
              isActive={activeStep === 1}
              onClick={() => setActiveStep(1)}
            />
            <div className="h-7 w-[2px] mx-auto bg-emerald-500/20 relative overflow-hidden">
              {activeStep === 1 && (
                <div className="w-full h-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <ObsidianCard02 isActive={activeStep === 1} onSelect={() => setActiveStep(1)} />
          </div>

          {/* Card 03 Pair */}
          <div className="space-y-3">
            <MobileStepTrigger
              data={timelineNodes[2]}
              isActive={activeStep === 2}
              onClick={() => setActiveStep(2)}
            />
            <div className="h-7 w-[2px] mx-auto bg-emerald-500/20 relative overflow-hidden">
              {activeStep === 2 && (
                <div className="w-full h-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <ObsidianCard03 isActive={activeStep === 2} onSelect={() => setActiveStep(2)} />
          </div>

          {/* Card 04 Pair */}
          <div className="space-y-3">
            <MobileStepTrigger
              data={timelineNodes[3]}
              isActive={activeStep === 3}
              onClick={() => setActiveStep(3)}
            />
            <div className="h-7 w-[2px] mx-auto bg-emerald-500/20 relative overflow-hidden">
              {activeStep === 3 && (
                <div className="w-full h-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <ObsidianCard04
              isActive={activeStep === 3}
              onSelect={() => setActiveStep(3)}
              countdown={formatCountdown(countdownSeconds)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// =========================================================================
// MOBILE STEP TRIGGER HELPER COMPONENT
// =========================================================================
function MobileStepTrigger({
  data,
  isActive,
  onClick,
}: {
  data: StepNodeData;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = data.icon;
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 cursor-pointer transition-all border ${
        isActive
          ? "bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/30"
          : "bg-white/80 border-neutral-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isActive
              ? "bg-gradient-to-br from-[#046307] to-[#10B981] text-white shadow-sm"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-mono font-bold text-emerald-800">
              {data.step}
            </span>
            {isActive && (
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Active Stage
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-[#0A0A0A] truncate">{data.title}</p>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// ARTIFACT CARD 01: Application Received (Real Email Preview)
// =========================================================================
function ObsidianCard01({
  isActive,
  onSelect,
}: {
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      onClick={onSelect}
      animate={{
        y: isActive ? -12 : 0,
        scale: isActive ? 1.03 : 0.98,
        opacity: isActive ? 1 : 0.72,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className={`bg-[#0A0A0A] text-white rounded-2xl p-6 border relative overflow-hidden flex flex-col justify-between transition-all duration-500 cursor-pointer ${
        isActive
          ? "border-emerald-400/80 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.38)] z-20"
          : "border-white/10 hover:border-white/20 z-10"
      }`}
    >
      {/* Top Emerald Radial Spotlight Glow */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/20 blur-2xl pointer-events-none rounded-full" />
      )}

      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
          <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
            <Mail size={13} className="text-emerald-400" />
            Application Received
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Delivered
          </span>
        </div>

        {/* Metadata Rows */}
        <div className="space-y-1.5 text-[11px] text-neutral-400 py-3 border-b border-white/10 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">To:</span>
            <span className="text-neutral-200">alex.mercer@gmail.com</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">From:</span>
            <span className="text-[#34D399] font-semibold">recruiter@company.com</span>
          </div>
        </div>

        {/* Email Body Box */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-neutral-300 leading-relaxed font-sans">
          Hi Alex, thank you for applying for the{" "}
          {isActive ? (
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-medium inline-block shadow-xs"
            >
              Senior Engineer
            </motion.span>
          ) : (
            <span className="font-semibold text-white">Senior Engineer</span>
          )}{" "}
          position at{" "}
          {isActive ? (
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
              className="bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-medium inline-block shadow-xs"
            >
              TechCorp
            </motion.span>
          ) : (
            <span className="font-semibold text-emerald-400">TechCorp</span>
          )}
          . Our team is reviewing your resume and will reach out with next steps.
        </div>
      </div>

      {/* Footer Status Pill */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-400" />
          Direct Recruiter Mailbox
        </span>
        <span className="text-neutral-500 font-mono text-[10px]">Just now</span>
      </div>
    </motion.div>
  );
}

// =========================================================================
// ARTIFACT CARD 02: AI Resume Screening & Scoring Verdict
// =========================================================================
function ObsidianCard02({
  isActive,
  onSelect,
}: {
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      onClick={onSelect}
      animate={{
        y: isActive ? -12 : 0,
        scale: isActive ? 1.03 : 0.98,
        opacity: isActive ? 1 : 0.72,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className={`bg-[#0A0A0A] text-white rounded-2xl p-6 border relative overflow-hidden flex flex-col justify-between transition-all duration-500 cursor-pointer ${
        isActive
          ? "border-emerald-400/80 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.38)] z-20"
          : "border-white/10 hover:border-white/20 z-10"
      }`}
    >
      {/* Top Emerald Radial Spotlight Glow */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/20 blur-2xl pointer-events-none rounded-full" />
      )}

      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
          <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-400" />
            AI Screening Verdict
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Qualified
          </span>
        </div>

        {/* Centerpiece Gauge: Circular SVG Score Indicator */}
        <div className="py-4 flex flex-col items-center justify-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-white/10"
                strokeWidth="7"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-emerald-400"
                strokeWidth="7"
                strokeDasharray="251.2"
                strokeLinecap="round"
                fill="none"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{
                  strokeDashoffset: isActive ? 251.2 * (1 - 0.96) : 251.2 * (1 - 0.72),
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-extrabold text-white font-mono tracking-tight">
                96%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">
                Match
              </span>
            </div>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-neutral-300 space-y-1.5 font-sans">
          <div className="flex items-center gap-1.5 text-neutral-200">
            <Check size={12} className="text-emerald-400 shrink-0" />
            <span>Technical Fit: Senior Full-Stack (6+ yrs)</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-200">
            <Check size={12} className="text-emerald-400 shrink-0" />
            <span>Knockout Criteria: 100% Passed</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Zap size={12} className="text-emerald-400 shrink-0" />
            <span>Action: Auto-Triggering Invite</span>
          </div>
        </div>
      </div>

      {/* Footer Verdict */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
        <span className="text-emerald-400 font-medium">Auto-Rank: Top 1%</span>
        <span className="text-neutral-500 font-mono text-[10px]">Scored in 0.4s</span>
      </div>
    </motion.div>
  );
}

// =========================================================================
// ARTIFACT CARD 03: Interview Invitation + Floating Meet Popover
// =========================================================================
function ObsidianCard03({
  isActive,
  onSelect,
}: {
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      onClick={onSelect}
      animate={{
        y: isActive ? -12 : 0,
        scale: isActive ? 1.03 : 0.98,
        opacity: isActive ? 1 : 0.72,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className={`bg-[#0A0A0A] text-white rounded-2xl p-6 border relative overflow-hidden flex flex-col justify-between transition-all duration-500 cursor-pointer ${
        isActive
          ? "border-emerald-400/80 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.38)] z-20"
          : "border-white/10 hover:border-white/20 z-10"
      }`}
    >
      {/* Top Emerald Radial Spotlight Glow */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/20 blur-2xl pointer-events-none rounded-full" />
      )}

      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
          <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
            <CalendarCheck size={13} className="text-emerald-400" />
            Interview Invitation
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Calendar Synced
          </span>
        </div>

        {/* Metadata Rows */}
        <div className="space-y-1.5 text-[11px] text-neutral-400 py-3 border-b border-white/10 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Date:</span>
            <span className="text-neutral-200">Oct 30, 10:00 AM (PKT)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Meeting:</span>
            <span className="text-[#34D399] font-semibold flex items-center gap-1">
              <Video size={11} /> Google Meet
            </span>
          </div>
        </div>

        {/* Email Body Box */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-neutral-300 leading-relaxed font-sans">
          Hi Alex, you have been shortlisted for an interview for{" "}
          <strong className="text-white">Senior Engineer</strong> at{" "}
          <strong className="text-emerald-400">TechCorp</strong>. Your video meeting link has been added to your calendar invitation.
        </div>
      </div>

      {/* Floating Google Meet Popover (Micro-Animation) */}
      <AnimatePresence>
        {isActive ? (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="mt-4 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 shadow-lg text-[11px] flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {/* Multi-Bar Animated Audio Waveform */}
              <div className="flex items-center gap-0.5 shrink-0">
                <motion.div
                  className="w-0.5 bg-emerald-400 rounded-full"
                  animate={{ height: [6, 14, 6] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
                <motion.div
                  className="w-0.5 bg-emerald-400 rounded-full"
                  animate={{ height: [12, 4, 12] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                />
                <motion.div
                  className="w-0.5 bg-emerald-400 rounded-full"
                  animate={{ height: [4, 16, 4] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                />
              </div>
              <span className="text-emerald-200 font-mono text-[10px] truncate">
                meet.google.com/xyz
              </span>
            </div>
            <span className="text-emerald-400 font-semibold text-[10px] shrink-0">
              Ready
            </span>
          </motion.div>
        ) : (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
              <ExternalLink size={11} /> meet.google.com/xyz
            </span>
            <span className="text-neutral-500 font-mono text-[10px]">Slot Confirmed</span>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =========================================================================
// ARTIFACT CARD 04: 24h & 1h Dual Reminders (Anti-No-Show Card)
// =========================================================================
function ObsidianCard04({
  isActive,
  onSelect,
  countdown,
}: {
  isActive: boolean;
  onSelect: () => void;
  countdown: string;
}) {
  return (
    <motion.div
      onClick={onSelect}
      animate={{
        y: isActive ? -12 : 0,
        scale: isActive ? 1.03 : 0.98,
        opacity: isActive ? 1 : 0.72,
      }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className={`bg-[#0A0A0A] text-white rounded-2xl p-6 border relative overflow-hidden flex flex-col justify-between transition-all duration-500 cursor-pointer ${
        isActive
          ? "border-emerald-400/80 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.38)] z-20"
          : "border-white/10 hover:border-white/20 z-10"
      }`}
    >
      {/* Top Emerald Radial Spotlight Glow */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/20 blur-2xl pointer-events-none rounded-full" />
      )}

      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
          <span className="font-bold text-white tracking-wide flex items-center gap-1.5">
            <BellRing size={13} className="text-emerald-400" />
            1-Hour Reminder
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Auto Sent
          </span>
        </div>

        {/* Metadata Rows */}
        <div className="space-y-1.5 text-[11px] text-neutral-400 py-3 border-b border-white/10 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Starts in:</span>
            <span className="text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
              <Clock size={10} />
              {countdown}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Channel:</span>
            <span className="text-neutral-200">Google Meet + Calendar Alert</span>
          </div>
        </div>

        {/* Email Body Box */}
        <div className="mt-3.5 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-neutral-300 leading-relaxed font-sans">
          Friendly reminder: your interview with{" "}
          <strong className="text-white">TechCorp</strong> begins in{" "}
          <strong className="text-emerald-400">1 hour</strong>. Please make sure your camera and microphone are ready before joining.
        </div>
      </div>

      {/* Bottom Schedule Strip */}
      <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-[10px] font-mono">
        <div className="flex items-center justify-between text-neutral-300">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Check size={11} /> 24-Hour Reminder
          </span>
          <span className="text-neutral-500">Delivered</span>
        </div>
        <div className="flex items-center justify-between text-neutral-300">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Check size={11} /> 1-Hour Reminder
          </span>
          <span className="text-neutral-500">Dispatched</span>
        </div>
      </div>
    </motion.div>
  );
}
