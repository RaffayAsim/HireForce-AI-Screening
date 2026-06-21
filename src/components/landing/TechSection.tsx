import { motion } from "framer-motion";
import { Cpu, Brain, Network } from "lucide-react";

const techFeatures = [
  {
    icon: Cpu,
    title: "Connect Infrastructure",
    description: "Link your own Supabase or n8n workflows. Complete control over your data pipeline and integrations.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Define Vision",
    description: "Set AI screening parameters tailored to your company culture and role requirements.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Network,
    title: "Force Results",
    description: "Get automated, ranked shortlists in seconds. Ready-to-interview candidates instantly.",
    color: "from-green-500 to-emerald-500",
  },
];

export default function TechSection() {
  return (
    <section id="how-it-works" className="py-32 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-bold mb-4 tracking-tight">How It Works</h2>
          <p className="text-xl text-gray-600">Three Simple Steps to Hiring Excellence</p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {techFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true, margin: "-100px" }}
                className="group cursor-pointer"
              >
                {/* Card */}
                <div className="relative h-96 rounded-2xl overflow-hidden shadow-soft-lg hover:shadow-soft-xl transition-all duration-300">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                  {/* Content */}
                  <div className="relative h-full p-8 bg-white/70 backdrop-blur-md group-hover:from-transparent group-hover:to-transparent flex flex-col justify-between transition-colors duration-300 border-2 border-slate-200 group-hover:border-white/50">
                    {/* Icon */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity } as any}
                      className="mb-6 inline-block p-4 bg-white group-hover:bg-white/20 rounded-xl transition-all"
                    >
                      <Icon className={`text-gray-900 group-hover:text-white transition-colors`} size={32} />
                    </motion.div>

                    {/* Text */}
                    <div>
                      <h3 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-white transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 group-hover:text-white/90 transition-colors">
                        {feature.description}
                      </p>
                    </div>

                    {/* Bottom Accent */}
                    <motion.div
                      animate={{ width: ["0%", "100%", "0%"] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 } as any}
                      className="h-1 bg-white/50 mt-4"
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Process Flow */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20 pt-20 border-t border-gray-200"
        >
          <h3 className="text-3xl font-bold text-center mb-16 tracking-tight">The Smart Hiring Pipeline</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {["Connect Infrastructure", "Define Vision", "Force Results"].map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1 relative">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg"
                >
                  {index + 1}
                </motion.div>
                <p className="text-gray-700 font-semibold text-center text-lg">{step}</p>
                {index < 2 && <div className="hidden md:block absolute top-8 left-1/2 w-1/3 h-0.5 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] opacity-40 -ml-1/3"></div>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
