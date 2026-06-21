import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const pricingPlans = [
  {
    name: "Free Trial",
    price: "$0",
    period: "/month",
    description: "Try before you buy - No credit card required",
    features: [
      "Upload up to 5 resumes for AI analysis",
      "Match Score (%) for each candidate",
      "Automated screening reports with Pros/Cons",
      "Preview of Settings panel for integrations",
      "Basic candidate dashboard",
    ],
    highlighted: true,
    isFree: true,
  },
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for small teams",
    features: [
      "Up to 500 CV screenings/month",
      "Basic AI filtering",
      "5 team members",
      "Email support",
      "Standard reports",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "Best for growing companies",
    features: [
      "Unlimited CV screenings",
      "Advanced AI filtering",
      "25 team members",
      "Priority support",
      "Advanced analytics",
      "Custom workflows",
      "API access",
    ],
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations",
    features: [
      "Custom screening capacity",
      "Custom AI models",
      "Unlimited team members",
      "24/7 dedicated support",
      "White-label solution",
      "Advanced integrations",
      "SLA guarantee",
    ],
    highlighted: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Radial Gradient Background */}
      <div className="absolute inset-0 bg-gradient-radial from-cyan-50 via-white to-white pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl font-bold mb-4 tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600 mb-4">Choose the perfect plan for your team</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-semibold">🎁 Free Trial Available: Test 5 resumes with AI analysis - No credit card required!</p>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                plan.highlighted
                  ? "ring-2 ring-[#00F5A0] bg-white shadow-soft-xl scale-105 border-2 border-[#00F5A0]"
                  : "bg-white glass hover:shadow-soft-xl border-2 border-slate-200 shadow-soft-lg"
              }`}
            >
              {/* Badge */}
              {plan.highlighted && (
                <div className={`py-2 text-center font-bold text-sm ${
                  plan.isFree 
                    ? "bg-gradient-to-r from-green-400 to-blue-500 text-white" 
                    : "bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] text-white"
                }`}>
                  {plan.isFree ? "🎁 FREE TRIAL - NO CREDIT CARD" : "🌟 MOST POPULAR"}
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>

                {/* Button */}
                <button
                  onClick={() => {
                    if (plan.isFree) {
                      navigate("/login");
                    } else {
                      const element = document.getElementById("contact-form");
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                        // Set selected package
                        const packageSelect = document.querySelector('select[name="package"]') as HTMLSelectElement | null;
                        if (packageSelect) {
                          packageSelect.value = plan.name;
                        }
                      }
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-bold mb-8 flex items-center justify-center gap-2 transition-all ${
                    plan.highlighted
                      ? "gradient-btn text-white"
                      : "border-2 border-gray-300 text-gray-700 hover:border-[#00F5A0] hover:text-[#00F5A0]"
                  }`}
                >
                  {plan.isFree ? "Start Free Trial" : "Get Started"}
                  <ArrowRight size={18} />
                </button>

                {/* Features */}
                <div className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      viewport={{ once: true }}
                      className="flex gap-3 items-start"
                    >
                      <Check className="text-emerald-500 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-32 pt-20 border-t border-gray-200"
        >
          <h3 className="text-3xl font-bold text-center mb-16 tracking-tight">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                q: "Can I change my plan anytime?",
                a: "Yes, upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! Try our free trial with up to 5 resume analyses. No credit card required - just sign up and test the AI speed instantly.",
              },
              {
                q: "What about data security?",
                a: "We use bank-level encryption and comply with GDPR, CCPA, and SOC 2 Type II standards.",
              },
              {
                q: "Do you offer discounts for annual billing?",
                a: "Yes, get 20% off when you choose annual billing on any plan.",
              },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="glass p-8 rounded-xl border-2 border-slate-200 shadow-soft-lg hover:shadow-soft-xl transition-all"
              >
                <h4 className="font-bold text-lg mb-3 text-gray-900 tracking-tight">{faq.q}</h4>
                <p className="text-gray-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form Section */}
        <motion.div
          id="contact-form"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-32 pt-20 border-t border-gray-200"
        >
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-4 tracking-tight text-slate-900">Get Started Today</h3>
            <p className="text-center text-slate-600 mb-12 text-lg">
              Fill this information and our team will directly call you for assistance
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                const orgName = formData.get("organizationName");
                const employees = formData.get("employees");
                const email = formData.get("email");
                const phone = formData.get("phone");
                const pkg = formData.get("package");
                
                const subject = `Hire Force Demo Request - ${orgName}`;
                const body = `Organization Name: ${orgName}%0ANumber of Employees: ${employees}%0AEmail: ${email}%0APhone: ${phone}%0ASelected Package: ${pkg}`;
                window.location.href = `mailto:raffay.asim6@gmail.com?subject=${subject}&body=${body}`;
              }}
              className="glass border-2 border-slate-300 rounded-2xl shadow-soft-lg p-8 space-y-6 bg-white/80"
            >
              <div>
                <label className="block text-slate-800 font-semibold mb-2">Organization Name</label>
                <input
                  type="text"
                  name="organizationName"
                  required
                  placeholder="Your company name"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00F5A0] focus:border-[#00F5A0] transition bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-semibold mb-2">Number of Employees</label>
                <input
                  type="number"
                  name="employees"
                  required
                  placeholder="e.g., 50"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00F5A0] focus:border-[#00F5A0] transition bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00F5A0] focus:border-[#00F5A0] transition bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 font-semibold mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00F5A0] focus:border-[#00F5A0] transition bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-semibold mb-2">Preferred Package</label>
                <select
                  name="package"
                  required
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00F5A0] focus:border-[#00F5A0] transition bg-white"
                >
                  <option value="">Select a package</option>
                  <option value="Free Trial">Free Trial - $0/month</option>
                  <option value="Starter">Starter - $29/month</option>
                  <option value="Pro">Pro - $99/month</option>
                  <option value="Enterprise">Enterprise - Custom pricing</option>
                </select>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full gradient-btn py-4 rounded-lg text-white font-bold text-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all shadow-lg"
              >
                Submit
                <ArrowRight size={20} />
              </motion.button>

              <p className="text-center text-slate-600 text-sm">
                We'll review your request and contact you shortly
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
