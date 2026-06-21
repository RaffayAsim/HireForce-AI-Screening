import { motion } from "framer-motion";
import { Mail, Linkedin, Twitter, Github, ArrowUp, Star } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center border border-white/30">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-2xl font-bold">Hire Force</span>
            </div>
            <p className="text-white/80">The Smart Way to Build Your Team.</p>
          </motion.div>

          {/* Product */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold mb-4 text-white">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#solutions" className="text-white/80 hover:text-white transition font-medium">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-white/80 hover:text-white transition font-medium">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-white/80 hover:text-white transition font-medium">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition font-medium">
                  Security
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold mb-4 text-white">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/80 hover:text-white transition font-medium">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition font-medium">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition font-medium">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition font-medium">
                  Contact
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold mb-4 text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/80 hover:text-white transition font-medium">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition font-medium">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition font-medium">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 pt-8 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-white/70"
            >
              © 2026 Hire Force AI. All rights reserved. Powered by Hire Force AI.
            </motion.p>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex gap-4"
            >
              {[
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Github, href: "#", label: "GitHub" },
                { icon: Mail, href: "mailto:hello@hireforce.ai", label: "Email" },
              ].map((social, idx) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={idx}
                    href={social.href}
                    whileHover={{ scale: 1.2 }}
                    className="text-white/80 hover:text-white transition"
                    aria-label={social.label}
                  >
                    <Icon size={20} />
                  </motion.a>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Scroll to Top Button */}
        <motion.button
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="fixed bottom-8 right-8 w-12 h-12 bg-white text-[#00F5A0] rounded-full flex items-center justify-center hover:shadow-xl transition-all hidden md:flex shadow-soft-lg font-bold"
        >
          <ArrowUp size={24} />
        </motion.button>
      </div>
    </footer>
  );
}
