import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Zap,
  Filter,
  Mail,
  Calendar,
  Building2,
  Shield,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Video,
  Send,
  Lock,
  Unlock
} from "lucide-react";

interface CardItem {
  index: string;
  tag: string;
  pillBadge: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  bgGradient: string;
}

const cardsData: CardItem[] = [
  {
    index: "01",
    tag: "HIGH-VOLUME SCREENING",
    pillBadge: "⚡ 50 CVs in 60s",
    title: "Screen 50+ resumes in 60 seconds",
    description:
      "Never drown in 30–50 applications per job again. HireForce automatically parses candidate CVs, computes percentage match scores, and generates instant qualification summaries.",
    ctaText: "Start Free Trial →",
    ctaLink: "/trial",
    bgGradient: "from-[#046307] via-[#057a44] to-[#059669]",
  },
  {
    index: "02",
    tag: "KNOCKOUT CRITERIA",
    pillBadge: "🛡️ Zero False Positives",
    title: "Filter out bad fits automatically",
    description:
      "Set mandatory must-haves: required certifications, tech stack depth, or location requirements. Candidates missing criteria are instantly flagged and filtered with zero guesswork.",
    ctaText: "Explore Knockouts →",
    ctaLink: "/trial",
    bgGradient: "from-[#03543f] via-[#046c4e] to-[#059669]",
  },
  {
    index: "03",
    tag: "DIRECT RECRUITER INBOX",
    pillBadge: "✉️ Gmail & Outlook",
    title: "Send invites from your own mailbox",
    description:
      "No generic 'no-reply' emails. Branded application confirmations and interview invitations are dispatched directly through your connected Gmail or Outlook with maximum open rates.",
    ctaText: "Connect Mailbox →",
    ctaLink: "/trial",
    bgGradient: "from-[#046307] via-[#057a44] to-[#10b981]",
  },
  {
    index: "04",
    tag: "1-CLICK MEETING ROOMS",
    pillBadge: "📅 Auto Google Meet",
    title: "Sync slots & meeting rooms instantly",
    description:
      "Schedule interviews with auto-generated Google Meet and Microsoft Teams video links. Confirmed slots sync directly to your recruiter calendar with 24h & 1h automated reminders.",
    ctaText: "View Calendar Flow →",
    ctaLink: "/trial",
    bgGradient: "from-[#03543f] via-[#047857] to-[#059669]",
  },
  {
    index: "05",
    tag: "MULTI-CLIENT AGENCY TAGGING",
    pillBadge: "🏢 Agency & In-House",
    title: "Brand emails per hiring client",
    description:
      "Recruiting for multiple companies? Assign client company names to jobs so applicants receive branded communications representing their specific hiring company.",
    ctaText: "Agency Workspaces →",
    ctaLink: "/trial",
    bgGradient: "from-[#046307] via-[#057a44] to-[#059669]",
  },
  {
    index: "06",
    tag: "SOFT PAUSE GUARANTEE",
    pillBadge: "🔓 Never Locked Out",
    title: "Keep your candidates forever",
    description:
      "When your free trial scan limit is reached, you are never locked out of your account. Review existing candidates, resumes, notes, and emails anytime with 100% read access.",
    ctaText: "Start 10 Free Scans →",
    ctaLink: "/trial",
    bgGradient: "from-[#034d38] via-[#046c4e] to-[#10b981]",
  },
];

export default function Solutions() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      id="solutions"
      ref={containerRef}
      className="relative bg-[#050807] text-white py-24 px-4 sm:px-6 lg:px-8 border-t border-emerald-950/80 overflow-visible"
    >
      {/* Background Dot Grid Matrix */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#10B981 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient Glowing Emerald Auras */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-emerald-500/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* ============================================================== */}
        {/* SECTION HEADER                                                 */}
        {/* ============================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sparkles size={13} className="text-emerald-400" />
            <span>Recruiter Automation Toolkit</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12] mb-4">
            Built for Real-World{" "}
            <span className="font-serif italic font-normal bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              Recruitment Workflows
            </span>
          </h2>

          <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Everything in-house HR leaders and independent agency recruiters need to handle high application volumes with speed and confidence.
          </p>
        </div>

        {/* ============================================================== */}
        {/* STACKED PERSPECTIVE CARDS CONTAINER                            */}
        {/* Cards stack on top of each other with progressive sticky tops  */}
        {/* ============================================================== */}
        <div className="relative">
          {cardsData.map((card, i) => {
            const targetScale = 1 - (cardsData.length - i) * 0.035;
            return (
              <StackingCard
                key={card.index}
                i={i}
                card={card}
                progress={scrollYProgress}
                range={[i * (1 / cardsData.length), 1]}
                targetScale={targetScale}
                total={cardsData.length}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===================================================================== */
/* INDIVIDUAL STACKING CARD WITH NATIVE STICKY PHYSICS                   */
/* ===================================================================== */
interface StackingCardProps {
  i: number;
  card: CardItem;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
  total: number;
}

function StackingCard({ i, card, progress, range, targetScale, total }: StackingCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Progressive scale & brightness as later cards slide over
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      ref={containerRef}
      className="min-h-[75vh] sm:min-h-[82vh] flex items-start justify-center sticky"
      style={{
        top: `calc(10vh + ${i * 28}px)`,
        zIndex: i + 10,
      }}
    >
      <motion.div
        style={{
          scale,
        }}
        className={`w-full rounded-[32px] p-7 sm:p-10 md:p-12 bg-gradient-to-br ${card.bgGradient} border border-emerald-400/35 shadow-[0_-10px_35px_rgba(0,0,0,0.35),0_25px_60px_rgba(0,0,0,0.6)] relative overflow-hidden`}
      >
        {/* Subtle Card Grid Pattern Texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        {/* Top Header Row of the Card */}
        <div className="relative z-10 flex items-center justify-between pb-6 mb-7 border-b border-white/20 text-xs">
          {/* Left: Step pill badge */}
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-black text-white font-mono font-black text-xs flex items-center justify-center shadow-md">
              {card.index}
            </span>
            <span className="font-mono font-bold tracking-wider uppercase text-white/95 text-[11px] sm:text-xs">
              {card.tag}
            </span>
          </div>

          {/* Right: Category highlight pill */}
          <span className="bg-black/25 text-white font-semibold text-xs px-3.5 py-1 rounded-full border border-white/20 shadow-xs backdrop-blur-sm">
            {card.pillBadge}
          </span>
        </div>

        {/* Card Main Body: 50/50 Layout */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left 6.5 Cols: Editorial Content */}
          <div className="lg:col-span-6 space-y-5">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.12]">
              {card.title}
            </h3>
            <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed max-w-lg">
              {card.description}
            </p>
            <div className="pt-2">
              <Link to={card.ctaLink}>
                <button className="h-12 px-7 rounded-full bg-[#0A0A0A] hover:bg-black text-white font-bold text-sm shadow-xl flex items-center gap-2 transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-white/10">
                  <span>{card.ctaText}</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Right 5.5 Cols: Dedicated Floating White Preview Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-white rounded-2xl p-5 sm:p-6 shadow-2xl text-zinc-900 border border-neutral-100">
              {i === 0 && <CardWidgetScreening />}
              {i === 1 && <CardWidgetKnockout />}
              {i === 2 && <CardWidgetEmailDrips />}
              {i === 3 && <CardWidgetMeetings />}
              {i === 4 && <CardWidgetAgency />}
              {i === 5 && <CardWidgetSoftPause />}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ===================================================================== */
/* WIDGET 01: High-Volume AI Screening (Live CV Streamer Card)            */
/* ===================================================================== */
function CardWidgetScreening() {
  const [count, setCount] = useState(38);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => (prev >= 50 ? 30 : prev + 4));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-[#0A0A0A]">Screening Pipeline</span>
        </div>
        <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
          {count}/50 CVs Processed
        </span>
      </div>

      {/* Candidate 1: Top match */}
      <div className="p-3 rounded-xl bg-neutral-50 border border-emerald-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center">
            AM
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0A0A0A]">Alex Mercer</h4>
            <p className="text-[11px] text-neutral-500">Full-Stack • 5y exp</p>
          </div>
        </div>
        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
          98% Match
        </span>
      </div>

      {/* Candidate 2 */}
      <div className="p-3 rounded-xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-neutral-900 text-white font-extrabold text-xs flex items-center justify-center">
            SL
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0A0A0A]">Sarah Lin</h4>
            <p className="text-[11px] text-neutral-500">Cloud Architect • 6y exp</p>
          </div>
        </div>
        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
          95% Match
        </span>
      </div>

      {/* Summary chip */}
      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-medium">
        <Sparkles size={14} className="text-emerald-600 shrink-0" />
        <span className="truncate">Top 2 candidates meet all tech and seniority filters.</span>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* WIDGET 02: Knockout Criteria & Custom Questions                       */
/* ===================================================================== */
function CardWidgetKnockout() {
  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
        <span className="text-xs font-bold text-[#0A0A0A]">Must-Have Knockout Gates</span>
        <span className="text-[10px] font-mono text-emerald-700 font-bold">3 CRITERIA ACTIVE</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className="text-[11px] font-semibold bg-neutral-900 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
          <Check size={11} className="text-emerald-400 stroke-[3]" />
          React / TypeScript (4+ yrs)
        </span>
        <span className="text-[11px] font-semibold bg-neutral-900 text-white px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
          <Check size={11} className="text-emerald-400 stroke-[3]" />
          AWS / Docker
        </span>
      </div>

      {/* Passed Candidate */}
      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-emerald-950">Elena Rostova</p>
          <p className="text-[10px] text-emerald-700">All 3 criteria verified from CV</p>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Passed Knockout
        </span>
      </div>

      {/* Filtered Candidate */}
      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
        <span className="text-rose-950 font-medium line-through">James Ray</span>
        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
          Filtered: Lacks 4+ yrs
        </span>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* WIDGET 03: Direct Gmail & Outlook Drips                               */
/* ===================================================================== */
function CardWidgetEmailDrips() {
  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
            Gmail Connected
          </span>
          <span className="text-[10px] font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
            Outlook Synced
          </span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
      </div>

      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
        <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
          <span>FROM: recruiter@youragency.com</span>
          <span className="text-emerald-700 font-bold">OAUTH 2.0</span>
        </div>
        <p className="text-xs font-bold text-[#0A0A0A]">
          Interview Invitation: Senior Cloud Architect
        </p>
        <p className="text-xs text-neutral-600 leading-relaxed font-mono bg-white p-2.5 rounded-lg border border-neutral-100">
          "Hi Sarah, your qualifications scored top 1% for our lead opening. Let's schedule a 30-min conversation."
        </p>
      </div>

      <div className="p-2.5 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold flex items-center justify-between shadow-md">
        <span className="flex items-center gap-1.5">
          <Check size={13} className="text-emerald-400 stroke-[3]" />
          Dispatched from your recruiter inbox
        </span>
        <span className="text-[10px] font-mono text-emerald-400">100% REPUTATION</span>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* WIDGET 04: 1-Click Meeting Rooms                                      */
/* ===================================================================== */
function CardWidgetMeetings() {
  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 text-xs">
        <span className="font-bold text-[#0A0A0A]">Select Interview Slot</span>
        <span className="text-[10px] font-mono text-emerald-700 font-bold">CALENDAR SYNCED</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="py-2 px-2 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
          Tue 10:00 AM
        </div>
        <div className="py-2 px-2 rounded-lg text-xs font-bold bg-[#0A0A0A] text-white border border-[#0A0A0A] shadow-xs">
          Tue 2:30 PM ✓
        </div>
        <div className="py-2 px-2 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
          Wed 11:00 AM
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Video size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">Google Meet Room Ready</p>
              <p className="text-[10px] text-emerald-700 font-mono">meet.google.com/abc-defg-hij</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded-full">
            Confirmed
          </span>
        </div>
        <p className="text-[11px] text-neutral-600 pl-10">
          Direct sync with Google Calendar & Outlook • Auto 24h & 1h reminders
        </p>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* WIDGET 05: Agency & Multi-Client Tagging                              */
/* ===================================================================== */
function CardWidgetAgency() {
  const [activeTab, setActiveTab] = useState(0);
  const clients = ["FinTech Corp", "Nexus Health", "Aura Luxury"];

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-100 text-xs">
        <span className="font-bold text-[#0A0A0A]">Select Client Workspace</span>
        <span className="text-[10px] font-mono text-emerald-700 font-bold">MULTI-TENANT</span>
      </div>

      <div className="flex gap-1.5">
        {clients.map((c, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all truncate border ${
              i === activeTab
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
          <span className="text-xs font-bold text-[#0A0A0A]">
            Branded Email Header: {clients[activeTab]}
          </span>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
            TAGGED
          </span>
        </div>
        <p className="text-xs text-neutral-600 font-mono">
          Candidate Subject: "Interview Request on behalf of <strong>{clients[activeTab]}</strong> hiring team"
        </p>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* WIDGET 06: Soft Pause Guarantee                                       */
/* ===================================================================== */
function CardWidgetSoftPause() {
  return (
    <div className="space-y-3 font-sans">
      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs font-bold text-amber-950">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Trial Limit Reached
        </span>
        <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-amber-300">
          SOFT PAUSE ACTIVE
        </span>
      </div>

      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Unlock size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0A0A0A]">Candidate Vault Unlocked</p>
            <p className="text-[10px] text-neutral-500 font-mono">100% Read Access Retained</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-full">
          Never Locked Out
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-700">
        <div className="p-2 rounded-lg bg-white border border-neutral-200 flex items-center gap-1.5">
          <Check size={11} className="text-emerald-600 stroke-[3]" />
          <span>Resumes Saved</span>
        </div>
        <div className="p-2 rounded-lg bg-white border border-neutral-200 flex items-center gap-1.5">
          <Check size={11} className="text-emerald-600 stroke-[3]" />
          <span>Candidate Notes</span>
        </div>
        <div className="p-2 rounded-lg bg-white border border-neutral-200 flex items-center gap-1.5">
          <Check size={11} className="text-emerald-600 stroke-[3]" />
          <span>Match Scores</span>
        </div>
        <div className="p-2 rounded-lg bg-white border border-neutral-200 flex items-center gap-1.5">
          <Check size={11} className="text-emerald-600 stroke-[3]" />
          <span>Email History</span>
        </div>
      </div>
    </div>
  );
}
