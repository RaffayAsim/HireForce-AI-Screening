import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  TrendingUp,
  Mail,
  Calendar,
  Filter,
  BarChart3,
  Bell,
  Settings,
  Zap,
  ArrowRight,
  Lock,
  Video,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { HireForceLogo } from "@/components/HireForceLogo";

export default function DashboardPreview() {
  const [selectedCandidate, setSelectedCandidate] = useState<string>("alex");

  const candidates = [
    {
      id: "alex",
      name: "Alex Mercer",
      role: "Sr. Full-Stack Engineer",
      score: 96,
      stage: "Shortlisted",
      stageColor: "text-emerald-800 bg-emerald-50 border border-emerald-300 font-bold",
      avatar: "AM",
      experience: "6 yrs exp",
      skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
      summary: "Exceptional architecture background. Meets 5/5 mandatory knockout requirements.",
      meetTime: "Today, 2:30 PM (Google Meet Room Ready)",
    },
    {
      id: "sarah",
      name: "Sarah Jenkins",
      role: "Frontend Lead",
      score: 89,
      stage: "Interview Set",
      stageColor: "text-blue-800 bg-blue-50 border border-blue-300 font-bold",
      avatar: "SJ",
      experience: "5 yrs exp",
      skills: ["Next.js", "Tailwind", "GraphQL", "Performance"],
      summary: "Strong UI/UX leadership. Verified portfolio with high-traffic enterprise apps.",
      meetTime: "Tomorrow, 10:00 AM (Google Meet Room Ready)",
    },
    {
      id: "omar",
      name: "Omar Hassan",
      role: "Backend Architect",
      score: 72,
      stage: "Under Review",
      stageColor: "text-amber-800 bg-amber-50 border border-amber-300 font-semibold",
      avatar: "OH",
      experience: "4 yrs exp",
      skills: ["Go", "Kubernetes", "gRPC", "Docker"],
      summary: "Solid backend foundations. Minor gap in full-stack frontend requirements.",
      meetTime: "Slot Pending Confirmation",
    },
    {
      id: "priya",
      name: "Priya Sharma",
      role: "DevOps Engineer",
      score: 64,
      stage: "Screened",
      stageColor: "text-neutral-700 bg-neutral-100 border border-neutral-200 font-semibold",
      avatar: "PS",
      experience: "3 yrs exp",
      skills: ["CI/CD", "Terraform", "Linux", "Bash"],
      summary: "Junior DevOps experience. Filtered for senior cloud lead criteria.",
      meetTime: "Not Scheduled",
    },
  ];

  const activeProfile = candidates.find((c) => c.id === selectedCandidate) || candidates[0];

  return (
    <section
      id="dashboard"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FAFAFA] border-t border-neutral-200/80 relative overflow-hidden text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900"
    >
      {/* 1. Full-Section Dot-Grid Background Pattern & Luxury Ambient Emerald Auras */}
      <div className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-20" />

      {/* Vibrant Ambient Glowing Emerald Auras */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[480px] left-1/2 -translate-x-1/2 w-[900px] h-[380px] bg-emerald-500/18 blur-[135px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ============================================================== */}
        {/* SECTION HEADER                                                 */}
        {/* ============================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0A0A0A] tracking-tight leading-[1.12] mb-3">
            The Recruiter Workspace
          </h2>
          <p className="text-base text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Live candidate evaluation, active job metrics, and synced interview communications in one unified view.
          </p>
        </motion.div>

        {/* ============================================================== */}
        {/* CLEAN AUTHENTIC DASHBOARD WINDOW                               */}
        {/* ============================================================== */}
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-80px" }}
            className="rounded-3xl bg-white border-2 border-emerald-500/35 shadow-[0_20px_60px_-15px_rgba(4,99,7,0.15)] overflow-hidden"
          >
            {/* Top Browser Bar */}
            <div className="bg-neutral-50 px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-3 px-4 py-1 rounded-md bg-white border border-neutral-200 text-[11px] text-neutral-600 font-mono shadow-2xs flex items-center gap-2">
                  <Lock size={10} className="text-emerald-600" />
                  <span>app.hireforce.ai/talent-pool/senior-fullstack</span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500">
                Recruiter: <strong className="text-emerald-700">Asim Rana</strong>
              </div>
            </div>

            {/* Dashboard Workspace Layout: Sidebar + Main Stage */}
            <div className="flex">
              {/* Sidebar (Desktop) */}
              <div className="hidden md:flex flex-col w-56 bg-neutral-50/90 border-r border-neutral-200 p-4 text-xs space-y-1 shrink-0">
                <div className="mb-6">
                  <HireForceLogo size="sm" to="" />
                </div>

                {[
                  { icon: BarChart3, label: "Dashboard", active: true },
                  { icon: Briefcase, label: "Jobs (3 Active)" },
                  { icon: Users, label: "Talent Pool" },
                  { icon: Calendar, label: "Interview Calendar" },
                  { icon: Mail, label: "Recruiter Inbox" },
                  { icon: Zap, label: "Automations" },
                  { icon: Bell, label: "Notifications" },
                  { icon: Settings, label: "Settings" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        item.active
                          ? "bg-emerald-100 text-emerald-950 font-bold border border-emerald-300 shadow-2xs"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                      }`}
                    >
                      <Icon size={14} className={item.active ? "text-emerald-700" : "text-neutral-400"} />
                      <span>{item.label}</span>
                    </div>
                  );
                })}

                <div className="flex-1" />

                {/* Connected Account Card */}
                <div className="mt-auto p-2.5 rounded-xl bg-white border border-neutral-200 text-[10px] text-neutral-600 shadow-2xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-[#0A0A0A]">Gmail Connected</span>
                  </div>
                  <div className="text-neutral-500 truncate font-mono">
                    asim@agency.com
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-5 sm:p-7 space-y-5 bg-[#FAFAFA] min-h-[560px]">
                {/* Top: Job Pipeline Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-base font-extrabold text-[#0A0A0A]">
                        Senior Full-Stack Engineer
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                        TechCorp Client
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Active Campaign • 42 Applicants Evaluated • 3 Invited to Video Interview
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-8 px-3 rounded-lg bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 flex items-center gap-1.5 shadow-2xs">
                      <Filter size={12} />
                      Criteria: 5+ Yrs & React
                    </div>
                    <div className="h-8 px-3.5 rounded-lg bg-emerald-600 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
                      + Add Candidates
                    </div>
                  </div>
                </div>

                {/* 4 Metric Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: "Total Applicants",
                      value: "42",
                      sub: "In pipeline",
                      icon: Users,
                      trend: "100% Parsed",
                      accent: "border-l-4 border-l-neutral-900",
                    },
                    {
                      label: "AI Screened",
                      value: "38",
                      sub: "Qualifications matched",
                      icon: Sparkles,
                      trend: "90% Qualified",
                      accent: "border-l-4 border-l-emerald-500",
                    },
                    {
                      label: "Avg. Match Score",
                      value: "84%",
                      sub: "12 above 85%",
                      icon: TrendingUp,
                      trend: "+18% vs avg",
                      accent: "border-l-4 border-l-emerald-600",
                    },
                    {
                      label: "Interviews Booked",
                      value: "3",
                      sub: "Google Meet rooms",
                      icon: Video,
                      trend: "0 No-shows",
                      accent: "border-l-4 border-l-blue-500",
                    },
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl bg-white border border-neutral-200 shadow-2xs hover:shadow-sm transition-all ${card.accent}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                            {card.label}
                          </span>
                          <Icon size={14} className="text-emerald-700" />
                        </div>
                        <div className="text-2xl font-black text-[#0A0A0A] tracking-tight">
                          {card.value}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-neutral-500">{card.sub}</span>
                          <span className="text-emerald-700 font-bold font-mono">{card.trend}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Two Columns: Candidate Table (Left) + Candidate Deep-Dive (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Candidate Table (7 cols) */}
                  <div className="lg:col-span-7 rounded-xl bg-white border border-neutral-200 shadow-2xs overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                      <div>
                        <h4 className="text-xs font-bold text-[#0A0A0A]">
                          AI Candidate Evaluation Results
                        </h4>
                        <p className="text-[10px] text-neutral-500">
                          Click any candidate to inspect qualification summary
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">
                        {candidates.length} CANDIDATES
                      </span>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-100 bg-neutral-50/80">
                      <div className="col-span-5">Candidate Profile</div>
                      <div className="col-span-3 text-center">Score</div>
                      <div className="col-span-4 text-right">Pipeline Stage</div>
                    </div>

                    {/* Candidate Rows */}
                    <div className="divide-y divide-neutral-100">
                      {candidates.map((c) => {
                        const isSelected = c.id === activeProfile.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCandidate(c.id)}
                            className={`grid grid-cols-12 gap-2 px-4 py-3 text-xs items-center cursor-pointer transition-all ${
                              isSelected
                                ? "bg-emerald-50/80 ring-1 ring-inset ring-emerald-500/40"
                                : "hover:bg-neutral-50"
                            }`}
                          >
                            <div className="col-span-5 flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-lg text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs ${
                                  isSelected ? "bg-emerald-600" : "bg-[#0A0A0A]"
                                }`}
                              >
                                {c.avatar}
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-[#0A0A0A] truncate">{c.name}</p>
                                <p className="text-[10px] text-neutral-500 font-mono truncate">{c.experience}</p>
                              </div>
                            </div>

                            <div className="col-span-3 text-center">
                              <span
                                className={`text-xs font-black font-mono ${
                                  c.score >= 85
                                    ? "text-emerald-700"
                                    : c.score >= 70
                                    ? "text-amber-700"
                                    : "text-neutral-500"
                                }`}
                              >
                                {c.score}%
                              </span>
                            </div>

                            <div className="col-span-4 text-right">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.stageColor}`}>
                                {c.stage}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Candidate AI Deep-Dive Inspector (Right 5 cols) */}
                  <div className="lg:col-span-5 rounded-xl bg-white border-2 border-emerald-500/30 p-4 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-[#0A0A0A]">AI Decision Breakdown</span>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                        {activeProfile.score}% MATCH
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-[#0A0A0A]">{activeProfile.name}</h4>
                      <p className="text-xs text-emerald-800 font-semibold">{activeProfile.role}</p>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                        "{activeProfile.summary}"
                      </p>
                    </div>

                    {/* Extracted Skills */}
                    <div>
                      <p className="text-[10px] font-bold uppercase text-neutral-400 mb-1.5 font-mono">
                        Extracted Skill Match:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {activeProfile.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interview status */}
                    <div className="p-2.5 rounded-lg bg-neutral-900 text-white space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Video size={13} />
                          Automated Video Invite
                        </span>
                        <span className="text-[10px] font-mono text-emerald-300">AUTO-SYNCED</span>
                      </div>
                      <p className="text-[10px] text-neutral-300 font-mono truncate">{activeProfile.meetTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-14 text-center"
        >
          <Link to="/trial">
            <button className="h-12 px-8 rounded-full bg-[#0A0A0A] hover:bg-black text-white font-bold text-sm flex items-center gap-2 mx-auto shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-emerald-500/30">
              <span>Start Free Trial (10 AI Scans Included)</span>
              <ArrowRight size={16} className="text-emerald-400" />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
