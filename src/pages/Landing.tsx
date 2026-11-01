import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Solutions from "@/components/landing/Solutions";
import DashboardPreview from "@/components/landing/DashboardPreview";
import AutomationShowcase from "@/components/landing/AutomationShowcase";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function Landing() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.startsWith("#") ? hash.slice(1) : hash;
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [hash]);

  return (
    <div className="bg-white min-h-screen text-zinc-900 selection:bg-emerald-500/20 selection:text-emerald-900 font-sans">
      <Navbar />
      <Hero />
      <Solutions />
      <DashboardPreview />
      <AutomationShowcase />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </div>
  );
}
