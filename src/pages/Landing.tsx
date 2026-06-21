import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Solutions from "@/components/landing/Solutions";
import TechSection from "@/components/landing/TechSection";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function Landing() {
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
