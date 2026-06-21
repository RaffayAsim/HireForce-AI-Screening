import { motion } from "framer-motion";
import { Zap, Lock, Sparkles } from "lucide-react";

const solutions = [
  {
    icon: Zap,
    title: "Automated Screening",
    description: "AI-driven CV analysis that instantly identifies top candidates based on your requirements.",
  },
  {
    icon: Lock,
    title: "Data Isolation",
    description: "Your own secure storage and workflows. Complete control and privacy of candidate data.",
  },
  {
    icon: Sparkles,
    title: "Instant Shortlisting",
    description: "Filter the best talent in seconds. Get ranked candidates ready for interview rounds.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function Solutions() {
  return (
    <section id="solutions" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-bold mb-4 tracking-tight">The Solution</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Enterprise-Grade AI Vision. We don't just search; we analyze intent, skills, and cultural fit on autopilot.</p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <motion.div
                key={index}
                variants={cardVariants}
                className="glass p-8 rounded-2xl transition-all duration-300 group cursor-pointer border-2 border-slate-200 hover:border-[#00F5A0]/50 shadow-soft-lg hover:shadow-soft-xl hover:shadow-emerald-200/30"
              >
                <div className="mb-6 inline-block p-5 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
                  <Icon className="text-white" size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">{solution.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{solution.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
