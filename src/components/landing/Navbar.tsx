import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, Star } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b-2 border-slate-200 shadow-sm">
      {/* Free Trial Banner */}
      {showBanner && (
        <div className="bg-red-600 text-white py-2 px-4 text-center relative">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span className="text-lg font-bold">🚨 FREE TRIAL ENDING SOON!</span>
            <span className="text-sm">Test 5 resumes with AI analysis - No credit card required. Sign up now!</span>
            <Link
              to="/login"
              className="bg-white text-red-600 px-4 py-1 rounded-full font-bold text-sm hover:bg-gray-100 transition"
            >
              Start Free Trial
            </Link>
          </div>
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200 text-xl"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 flex-shrink-0"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:inline">Hire Force</span>
          </motion.div>

          {/* Center Links - Hidden on Mobile */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="hidden md:flex gap-8"
          >
            <a href="#solutions" className="text-gray-700 hover:text-gray-900 transition font-medium text-sm">
              Solutions
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-gray-900 transition font-medium text-sm">
              How it Works
            </a>
            <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition font-medium text-sm">
              Pricing
            </a>
          </motion.div>

          {/* Right: Sign In Button + Mobile Menu */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link
                to="/login"
                className="gradient-btn px-6 py-2 rounded-lg text-white font-semibold text-sm hover:shadow-lg transition-all hidden sm:inline-block"
              >
                Sign In / Sign Up
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4 border-t-2 border-slate-200"
          >
            <div className="flex flex-col gap-3 pt-4">
              <a
                href="#solutions"
                className="text-gray-700 hover:text-gray-900 transition font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                Solutions
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-gray-900 transition font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-gray-900 transition font-medium px-2 py-2"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </a>
              <Link
                to="/login"
                className="gradient-btn px-6 py-2 rounded-lg text-white font-semibold text-sm hover:shadow-lg transition-all w-full text-center"
                onClick={() => setIsOpen(false)}
              >
                Sign In / Sign Up
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
