import { motion } from "framer-motion";
import { Briefcase, Sparkles, Send, Calendar, CheckCircle2 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Briefcase,
    title: "Post Job & Set Criteria",
    description: "Create your job opening, specify your required technical skills, experience requirements, and client company name in under 60 seconds.",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "AI Evaluates 30-50 Resumes",
    description: "Drop your applicant CVs into the pipeline. HireForce instantly analyzes each candidate, computes match scores, and highlights top tier talent.",
  },
  {
    step: "03",
    icon: Send,
    title: "Automate Invites & Meet Links",
    description: "Shortlisted candidates automatically receive branded email interview invitations with 1-click Google Meet links directly from your synced recruiter inbox.",
  },
];

export default function TechSection() {
  return (
    <section id="how-it-works" className="py-28 px-4 sm:px-6 lg:px-8 bg-white border-t border-zinc-200/80">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-bold mb-3">
            Simple 3-Step Flow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 tracking-tight mb-3">
            How HireForce Works
          </h2>
          <p className="text-base text-zinc-600 max-w-xl mx-auto">
            From bulk resume upload to booked interview slots with zero manual friction.
          </p>
        </motion.div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                viewport={{ once: true, margin: "-100px" }}
                className="p-8 rounded-2xl bg-zinc-50 border border-zinc-200/90 relative hover:border-emerald-500/50 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                      <Icon size={24} />
                    </div>
                    <span className="text-3xl font-black text-zinc-200 font-mono">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-950 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200/60 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Fully Automated</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
