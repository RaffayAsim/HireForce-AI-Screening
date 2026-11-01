import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowUpRight, ArrowRight, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPromo, setShowPromo] = useState(true);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all font-sans">
      {/* 1. Red Promotional Banner (Features Showcase Offer) */}
      {showPromo && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-2 text-xs font-medium shadow-sm border-b border-red-500/30 relative z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wider uppercase shrink-0 font-mono flex items-center gap-1 shadow-2xs">
                <span>🔥</span> Promo Active
              </span>
              <p className="truncate text-white text-xs">
                <strong className="font-bold">Spring Recruitment Sprint:</strong> 10 Free AI CV Screenings + Automated Gmail/Outlook Outreach &amp; 1-Click Video Rooms included!
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/trial"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-red-700 hover:bg-neutral-100 font-bold text-[11px] shadow-xs transition-colors cursor-pointer"
              >
                <span>Claim 10 Free Scans</span>
                <ArrowRight size={12} />
              </Link>
              <button
                type="button"
                onClick={() => setShowPromo(false)}
                className="p-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                aria-label="Dismiss promotion"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Luxury Navbar */}
      <nav className="bg-[#FAFAFA]/90 backdrop-blur-xl border-b border-black/[0.06] transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          {/* Left: Neural Talent Prism Brand Mark & Wordmark */}
          <BrandLogo size="md" theme="light" />

          {/* Center: Navigation links in #0A0A0A/70 with smooth hover transitions to #046307 */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              to="/#solutions"
              className="text-sm font-medium text-[#0A0A0A]/70 hover:text-[#046307] transition-colors"
            >
              Solutions
            </Link>
            <Link
              to="/#how-it-works"
              className="text-sm font-medium text-[#0A0A0A]/70 hover:text-[#046307] transition-colors"
            >
              How it Works
            </Link>
            <Link
              to="/#pricing"
              className="text-sm font-medium text-[#0A0A0A]/70 hover:text-[#046307] transition-colors"
            >
              Pricing
            </Link>
          </div>

          {/* Right: Sleek pill-shaped Login and Start Free Trial buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="h-10 px-6 rounded-full text-sm font-medium text-[#0A0A0A] bg-white border border-black/15 hover:border-emerald-600 hover:text-[#046307] shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Login</span>
              <ArrowUpRight size={14} className="text-[#0A0A0A]/50 group-hover:text-[#046307]" />
            </Link>
            <Link
              to="/trial"
              className="h-10 px-6 rounded-full text-sm font-medium text-white bg-[#0A0A0A] hover:bg-[#046307] shadow-sm transition-all flex items-center gap-2"
            >
              <span>Start Free Trial</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              to="/trial"
              className="px-3 py-1.5 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold"
            >
              Free Trial
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-[#0A0A0A] hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-neutral-200 px-6 py-6 space-y-4 shadow-xl">
            <Link
              to="/#solutions"
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-[#0A0A0A]/80 hover:text-[#046307]"
            >
              Solutions
            </Link>
            <Link
              to="/#how-it-works"
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-[#0A0A0A]/80 hover:text-[#046307]"
            >
              How it Works
            </Link>
            <Link
              to="/#pricing"
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-[#0A0A0A]/80 hover:text-[#046307]"
            >
              Pricing
            </Link>
            <div className="pt-4 border-t border-neutral-100 flex flex-col gap-3">
              <Link
                to="/trial"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 rounded-full bg-[#0A0A0A] text-white font-medium text-sm shadow-md"
              >
                Start Free Trial
              </Link>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 rounded-full bg-white border border-neutral-300 text-neutral-800 font-medium text-sm"
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
