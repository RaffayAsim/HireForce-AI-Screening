import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="min-h-screen pt-40 pb-32 px-4 sm:px-6 lg:px-8 flex items-center relative overflow-hidden">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 bg-gradient-radial from-emerald-50 via-white to-white pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight"
          >
            <span className="block mb-3">Automated AI</span>
            <span className="gradient-text">Candidate Screening</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-gray-600 mb-8 leading-relaxed"
          >
            Save <span className="font-bold text-gray-900">80% of your HR time</span> with intelligent AI-powered candidate screening. 
            Find the perfect talent in seconds, not days.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex gap-4 flex-wrap"
          >
            <Link to="/login" className="inline-block">
              <button className="gradient-btn px-8 py-4 rounded-lg text-white font-bold text-lg flex items-center gap-2 hover:gap-3 transition-all shadow-lg hover:shadow-xl border-2 border-transparent hover:border-white/20">
                Get Started
                <ArrowRight size={20} />
              </button>
            </Link>
            <a href="#solutions" className="inline-block">
              <button className="px-8 py-4 rounded-lg border-2 border-gray-400 text-gray-700 font-bold hover:border-[#00F5A0] hover:text-[#00F5A0] hover:bg-[#00F5A0]/5 transition-all duration-300">
                Explore Features
              </button>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex gap-12 mt-16 flex-wrap"
          >
            <div>
              <p className="text-4xl font-bold gradient-text">10K+</p>
              <p className="text-gray-600 text-sm mt-1">Candidates Screened</p>
            </div>
            <div>
              <p className="text-4xl font-bold gradient-text">98%</p>
              <p className="text-gray-600 text-sm mt-1">Accuracy Rate</p>
            </div>
            <div>
              <p className="text-4xl font-bold gradient-text">80%</p>
              <p className="text-gray-600 text-sm mt-1">Time Saved</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Visual - AI Scanning GIF */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
          transition={{ duration: 0.8, delay: 0.2, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } as any }}
          className="relative h-96 lg:h-full min-h-96"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#00F5A0]/20 to-[#00D9F5]/20 rounded-3xl blur-3xl"></div>
          <div className="relative h-full flex items-center justify-center bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-3xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Animated AI Scanning Visual */}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-64 h-64 bg-white/20 rounded-full flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="w-48 h-48 border-4 border-transparent border-t-white border-r-white rounded-full opacity-60"
                ></motion.div>
              </motion.div>
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute text-white text-2xl font-bold tracking-tight"
              >
                AI Scanning...
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
