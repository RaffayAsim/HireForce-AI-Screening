import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Mail,
  Calendar,
  Video,
  CheckCircle2,
  Check,
  Send
} from "lucide-react";

export default function Hero() {
  // Coordinated 6.0s master animation timeline loop
  // Phase 1 (0.0s - 1.5s): Candidate screening scan line sweeps & match flips to 98%
  // Phase 2 (1.5s - 2.5s): Glowing energy pulse travels along left path into AI Core; Core pulses & expands
  // Phase 3 (2.5s - 4.0s): Three simultaneous neon emerald beams burst from AI Core to right cards
  // Phase 4 (4.0s - 5.5s): Right-hand cards illuminate with emerald glow & animate micro-interactions
  // Phase 5 (5.5s - 6.0s): Reset for next cycle
  const [animationPhase, setAnimationPhase] = useState<1 | 2 | 3 | 4>(1);

  // Typing effect text for Email Sequence card
  const fullTypingText = "Sending personalized interview invite...";
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(1);
      setTimeout(() => setAnimationPhase(2), 1500);
      setTimeout(() => setAnimationPhase(3), 2500);
      setTimeout(() => setAnimationPhase(4), 4000);
    }, 6000);

    const t2 = setTimeout(() => setAnimationPhase(2), 1500);
    const t3 = setTimeout(() => setAnimationPhase(3), 2500);
    const t4 = setTimeout(() => setAnimationPhase(4), 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Micro typing animation when phase 4 is reached
  useEffect(() => {
    if (animationPhase === 4) {
      let index = 0;
      setTypedText("");
      const typeInterval = setInterval(() => {
        if (index < fullTypingText.length) {
          setTypedText((prev) => prev + fullTypingText.charAt(index));
          index++;
        } else {
          clearInterval(typeInterval);
        }
      }, 35);
      return () => clearInterval(typeInterval);
    } else if (animationPhase === 1) {
      setTypedText("");
    }
  }, [animationPhase]);

  return (
    <section className="relative pt-40 sm:pt-44 pb-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Subtle Radial Dot-Grid Background Pattern & Luxury Ambient Emerald Auras */}
      <div
        className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-[0.16]"
        style={{
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, #000 65%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 30%, #000 65%, transparent 100%)",
        }}
      />

      {/* Vibrant Ambient Glowing Emerald Auras behind the centerpiece */}
      <div className="absolute top-44 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[550px] left-1/2 -translate-x-1/2 w-[900px] h-[380px] bg-emerald-500/20 blur-[135px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ============================================================== */}
        {/* 2. GRAND CENTERED EDITORIAL HEADER & CTA BLOCK                 */}
        {/* (Full Original Grandeur Scale — No Badge)                      */}
        {/* ============================================================== */}
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          {/* Main Headline (Original Grand Editorial Size) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-1 mb-6"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-extrabold tracking-tight text-[#0A0A0A] font-sans leading-[1.08]">
              Automated AI
            </h1>
            <h2 className="font-serif italic font-normal text-5xl sm:text-6xl md:text-7xl lg:text-[5.2rem] bg-gradient-to-r from-[#046307] via-[#059669] to-[#10B981] bg-clip-text text-transparent leading-[1.12] pb-1">
              Talent Orchestration
            </h2>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="max-w-2xl text-base sm:text-lg text-neutral-600 leading-relaxed mb-9"
          >
            Save <strong className="text-[#046307] font-bold">80% of your HR time</strong> with intelligent candidate screening, automated email sequences, instant calendar booking, and live video interview orchestration.
          </motion.p>

          {/* Dual Luxury CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 w-full sm:w-auto"
          >
            {/* Primary CTA (Start Free Trial): Solid Obsidian Black with emerald bottom glow & hover shimmer */}
            <Link to="/trial" className="w-full sm:w-auto">
              <button className="relative group w-full sm:w-auto h-14 px-9 rounded-full bg-[#0A0A0A] text-white font-medium text-sm flex items-center justify-center gap-2.5 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.55)] hover:scale-[1.02] active:scale-[0.99] transition-all overflow-hidden cursor-pointer border border-emerald-500/30">
                {/* Shimmer sweep highlight on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent transition-transform ease-in-out pointer-events-none" />
                <span>Start Free Trial (10 Scans Free)</span>
                <ArrowRight size={16} className="text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>

            {/* Secondary CTA (Explore Features): Crisp white pill button */}
            <a href="#how-it-works" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto h-14 px-8 rounded-full bg-white text-[#0A0A0A] border border-neutral-300 hover:border-emerald-500 font-medium text-sm transition-all shadow-xs hover:bg-neutral-50 flex items-center justify-center gap-2 cursor-pointer">
                <span>Explore Features</span>
              </button>
            </a>
          </motion.div>
        </div>

        {/* ============================================================== */}
        {/* 3. PROMINENT & HIGH-EMERALD WORKFLOW ORCHESTRATION CANVAS      */}
        {/* (Full Grand Scale: mt-14, p-8 md:p-12, rounded-3xl)           */}
        {/* ============================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-6xl mx-auto mt-14 p-6 sm:p-8 md:p-12 rounded-3xl relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/50 to-white/95 backdrop-blur-2xl border-2 border-emerald-500/40 shadow-[0_20px_60px_-15px_rgba(4,99,7,0.18)] ring-1 ring-emerald-500/20"
        >
          {/* Subtle Emerald Top Glow Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_#10B981]" />

          {/* Canvas Top Bar Status */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
              <span className="font-extrabold text-[#046307] tracking-tight">
                LIVE WORKFLOW ORCHESTRATION
              </span>
              <span className="text-emerald-400">•</span>
              <span className="text-neutral-600 hidden sm:inline font-medium">
                Autonomous Recruiter Pipeline
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full font-mono text-[11px] font-bold shadow-xs">
                LATENCY: 42ms
              </span>
            </div>
          </div>

          {/* Background SVG Connection Layer with Prominent Glowing Beams */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none z-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 480"
              fill="none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="vibrantEmeraldBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#046307" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#10B981" stopOpacity="1" />
                  <stop offset="70%" stopColor="#00FF87" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                </linearGradient>
                <filter id="intenseGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Base Path 1: Candidate Card -> AI Core */}
              <path
                d="M 285 240 C 355 240, 400 240, 440 240"
                stroke="#10B981"
                strokeOpacity="0.55"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />

              {/* Base Path 2: AI Core -> Top-Right Card (Email) */}
              <path
                d="M 560 240 C 620 240, 645 110, 715 110"
                stroke="#10B981"
                strokeOpacity="0.55"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />

              {/* Base Path 3: AI Core -> Middle-Right Card (Calendar) */}
              <path
                d="M 560 240 C 620 240, 655 240, 715 240"
                stroke="#10B981"
                strokeOpacity="0.55"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />

              {/* Base Path 4: AI Core -> Bottom-Right Card (Video) */}
              <path
                d="M 560 240 C 620 240, 645 370, 715 370"
                stroke="#10B981"
                strokeOpacity="0.55"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />

              {/* ANIMATED PULSE 1: Candidate -> Core (Phase 2: 1.5s - 2.5s) */}
              {animationPhase >= 2 && (
                <motion.path
                  d="M 285 240 C 355 240, 400 240, 440 240"
                  stroke="url(#vibrantEmeraldBeam)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  filter="url(#intenseGlow)"
                  initial={{ pathOffset: 0, pathLength: 0.35, opacity: 0 }}
                  animate={{
                    pathOffset: [0, 1],
                    pathLength: [0.2, 0.5, 0.2],
                    opacity: [0, 1, 0],
                  }}
                  transition={{ duration: 1.0, ease: "easeInOut" }}
                />
              )}

              {/* ANIMATED PULSES 2, 3, 4: Core -> Right Cards (Phase 3: 2.5s - 4.0s) */}
              {animationPhase >= 3 && (
                <>
                  <motion.path
                    d="M 560 240 C 620 240, 645 110, 715 110"
                    stroke="url(#vibrantEmeraldBeam)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    filter="url(#intenseGlow)"
                    initial={{ pathOffset: 0, pathLength: 0.3, opacity: 0 }}
                    animate={{
                      pathOffset: [0, 1],
                      pathLength: [0.25, 0.5, 0.25],
                      opacity: [0, 1, 0],
                    }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />

                  <motion.path
                    d="M 560 240 C 620 240, 655 240, 715 240"
                    stroke="url(#vibrantEmeraldBeam)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    filter="url(#intenseGlow)"
                    initial={{ pathOffset: 0, pathLength: 0.3, opacity: 0 }}
                    animate={{
                      pathOffset: [0, 1],
                      pathLength: [0.25, 0.5, 0.25],
                      opacity: [0, 1, 0],
                    }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />

                  <motion.path
                    d="M 560 240 C 620 240, 645 370, 715 370"
                    stroke="url(#vibrantEmeraldBeam)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    filter="url(#intenseGlow)"
                    initial={{ pathOffset: 0, pathLength: 0.3, opacity: 0 }}
                    animate={{
                      pathOffset: [0, 1],
                      pathLength: [0.25, 0.5, 0.25],
                      opacity: [0, 1, 0],
                    }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </>
              )}
            </svg>
          </div>

          {/* 3-Column Horizontal Architecture */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
            {/* ========================================================== */}
            {/* LEFT COLUMN: Input Node — Candidate Screening Card         */}
            {/* ========================================================== */}
            <div className="lg:col-span-4 flex justify-center lg:justify-start">
              <motion.div
                whileHover={{ y: -3 }}
                animate={{
                  scale: animationPhase === 1 ? [1, 1.02, 1] : 1,
                  boxShadow:
                    animationPhase === 1
                      ? "0 20px 45px -5px rgba(16,185,129,0.35)"
                      : "0 10px 30px -10px rgba(0,0,0,0.06)",
                }}
                transition={{ duration: 1.5 }}
                className="w-full max-w-sm rounded-2xl bg-white/95 border-2 border-emerald-500/40 p-5 shadow-lg relative overflow-hidden group ring-1 ring-emerald-500/20"
              >
                {/* Laser scan line sweeping vertically across card (0.0s - 1.5s) */}
                <motion.div
                  animate={{
                    top: animationPhase === 1 ? ["0%", "100%", "0%"] : "0%",
                    opacity: animationPhase === 1 ? [0.9, 1, 0.9] : 0,
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00FF87] to-transparent shadow-[0_0_18px_#00FF87] z-20 pointer-events-none"
                />

                {/* Card Header Tag */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>INPUT NODE</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                    RESUME PARSER
                  </span>
                </div>

                {/* Candidate Profile Details */}
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#052e16] via-[#046307] to-[#10B981] text-white font-extrabold text-base flex items-center justify-center shadow-md border border-emerald-400/40">
                      AR
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center">
                      <Check size={8} className="text-white stroke-[3]" />
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-[#0A0A0A] tracking-tight">
                      Alex Rivera
                    </h4>
                    <p className="text-xs font-semibold text-emerald-800">
                      Senior Product Engineer
                    </p>
                    <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                      6+ yrs exp • React, Node, Cloud
                    </p>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                    TypeScript
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                    Distributed Systems
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                    98% Fit
                  </span>
                </div>

                {/* Dynamic Status Pill at Bottom */}
                <div className="pt-3 border-t border-emerald-100">
                  <AnimatePresence mode="wait">
                    {animationPhase === 1 ? (
                      <motion.div
                        key="scanning"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="w-full py-2 px-3 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs font-medium flex items-center justify-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Scanning Resume Criteria...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="verified"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-[0_4px_18px_rgba(16,185,129,0.45)]"
                      >
                        <CheckCircle2 size={15} className="text-white" />
                        <span>98% Match Verified</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* ========================================================== */}
            {/* CENTER COLUMN: The Hire Force AI Core                      */}
            {/* ========================================================== */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center py-6 lg:py-0">
              <div className="relative flex items-center justify-center">
                {/* 3 Concentric Glowing Emerald Radar Rings */}
                <motion.div
                  animate={{
                    scale: [1, 1.45, 1.9],
                    opacity: [0.7, 0.3, 0],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute w-28 h-28 rounded-full border-2 border-emerald-400 pointer-events-none"
                />
                <motion.div
                  animate={{
                    scale: [1, 1.55, 2.2],
                    opacity: [0.6, 0.25, 0],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    delay: 0.9,
                    ease: "easeOut",
                  }}
                  className="absolute w-28 h-28 rounded-full border border-emerald-300 pointer-events-none"
                />

                {/* 3D-styled Obsidian Black & Emerald pulsing orb */}
                <motion.div
                  animate={{
                    scale: animationPhase === 2 ? [1, 1.15, 1.05] : [1, 1.04, 1],
                    boxShadow:
                      animationPhase === 2 || animationPhase === 3
                        ? "0 0 55px 14px rgba(16,185,129,0.85)"
                        : "0 0 35px 6px rgba(16,185,129,0.55)",
                  }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#052e16] via-[#046307] to-[#10B981] flex flex-col items-center justify-center shadow-2xl relative z-10 border-2 border-emerald-300 cursor-default"
                >
                  <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white mb-0.5 shadow-xs">
                    <Sparkles size={20} className="text-emerald-200" />
                  </div>
                  <span className="text-[10px] font-mono font-black tracking-widest text-emerald-100 uppercase">
                    AI CORE
                  </span>
                </motion.div>
              </div>

              {/* Labeled 'Hire Force AI Core' underneath */}
              <div className="mt-4 text-center">
                <h5 className="font-extrabold text-sm text-[#046307] tracking-tight">
                  Hire Force AI Core
                </h5>
                <p className="text-[11px] font-mono font-semibold text-emerald-700 mt-0.5">
                  Autonomous Decision Engine
                </p>
              </div>
            </div>

            {/* ========================================================== */}
            {/* RIGHT COLUMN: 3 Stacked Output Cards                       */}
            {/* ========================================================== */}
            <div className="lg:col-span-4 space-y-3.5">
              {/* Card 1: 1) Email Sequence */}
              <motion.div
                whileHover={{ y: -3 }}
                animate={{
                  scale: animationPhase === 4 ? 1.03 : 1,
                  borderColor:
                    animationPhase === 4
                      ? "rgba(16,185,129,0.85)"
                      : "rgba(16,185,129,0.35)",
                  boxShadow:
                    animationPhase === 4
                      ? "0 12px 30px -5px rgba(16,185,129,0.35)"
                      : "0 2px 8px -2px rgba(0,0,0,0.04)",
                }}
                transition={{ duration: 0.5 }}
                className="p-4 rounded-2xl bg-white/95 border-2 border-emerald-500/30 shadow-xs transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Mail size={16} />
                    </div>
                    <span className="text-xs font-bold text-[#0A0A0A]">
                      1) Email Sequence
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Check size={10} className="stroke-[3]" />
                    Sequence Sent
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-600 bg-neutral-50/90 p-2 rounded-lg border border-neutral-100 flex items-center justify-between">
                  <span className="truncate">
                    {animationPhase === 4 && typedText
                      ? typedText
                      : "Sending personalized interview invite..."}
                    {animationPhase === 4 && (
                      <span className="inline-block w-1.5 h-3 bg-emerald-600 ml-1 animate-pulse" />
                    )}
                  </span>
                  <Send size={12} className="text-emerald-600 shrink-0 ml-2" />
                </div>
              </motion.div>

              {/* Card 2: 2) Calendar Invite */}
              <motion.div
                whileHover={{ y: -3 }}
                animate={{
                  scale: animationPhase === 4 ? 1.03 : 1,
                  borderColor:
                    animationPhase === 4
                      ? "rgba(16,185,129,0.85)"
                      : "rgba(16,185,129,0.35)",
                  boxShadow:
                    animationPhase === 4
                      ? "0 12px 30px -5px rgba(16,185,129,0.35)"
                      : "0 2px 8px -2px rgba(0,0,0,0.04)",
                }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="p-4 rounded-2xl bg-white/95 border-2 border-emerald-500/30 shadow-xs transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Calendar size={16} />
                    </div>
                    <span className="text-xs font-bold text-[#0A0A0A]">
                      2) Calendar Invite
                    </span>
                  </div>
                  <motion.span
                    animate={{
                      scale: animationPhase === 4 ? [0.8, 1.25, 1] : 1,
                    }}
                    transition={{ duration: 0.35 }}
                    className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs"
                  >
                    <Check size={12} className="stroke-[3]" />
                  </motion.span>
                </div>
                <p className="text-xs font-bold text-emerald-950 pl-10">
                  Confirmed Meeting Slot • Tue, 2:30 PM
                </p>
                <p className="text-[11px] text-neutral-500 pl-10">
                  Direct sync with Google Calendar & Outlook
                </p>
              </motion.div>

              {/* Card 3: 3) Video Interview Room */}
              <motion.div
                whileHover={{ y: -3 }}
                animate={{
                  scale: animationPhase === 4 ? 1.03 : 1,
                  borderColor:
                    animationPhase === 4
                      ? "rgba(16,185,129,0.85)"
                      : "rgba(16,185,129,0.35)",
                  boxShadow:
                    animationPhase === 4
                      ? "0 12px 30px -5px rgba(16,185,129,0.35)"
                      : "0 2px 8px -2px rgba(0,0,0,0.04)",
                }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="p-4 rounded-2xl bg-white/95 border-2 border-emerald-500/30 shadow-xs transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Video size={16} />
                    </div>
                    <span className="text-xs font-bold text-[#0A0A0A]">
                      3) Video Interview Room
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase">
                      Live Room
                    </span>
                  </div>
                </div>

                {/* Animated Multi-Bar Audio Equalizer Waveform in Emerald */}
                <div className="flex items-center justify-between pl-10 pr-2 py-1">
                  <div className="flex items-end gap-1 h-5">
                    {[12, 18, 8, 16, 20, 10, 15, 18, 9, 14].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          height:
                            animationPhase === 4
                              ? [4, h, 6, h * 0.8, 5]
                              : [4, 6, 4],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.08,
                          ease: "easeInOut",
                        }}
                        className="w-1 bg-gradient-to-t from-[#046307] to-[#10B981] rounded-full"
                      />
                    ))}
                  </div>

                  <span className="text-[10px] font-mono font-medium text-emerald-900 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    meet.google.com/abc-defg-hij
                  </span>
                </div>

                <div className="mt-2 pl-10">
                  <span className="inline-block text-[11px] font-semibold text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-xs">
                    Auto-Generated Google Meet / Zoom
                  </span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
