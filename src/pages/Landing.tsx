import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Solutions from "@/components/landing/Solutions";
import TechSection from "@/components/landing/TechSection";
import Pricing from "@/components/landing/Pricing";
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
    <div className="bg-white min-h-screen text-gray-900 selection:bg-[#00F5A0]/30">
      <Navbar />
      <Hero />
      <Solutions />
      <TechSection />
      <Pricing />
      <Footer />
    </div>
  );
}
