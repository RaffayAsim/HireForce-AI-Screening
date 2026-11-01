import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Briefcase,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Phone,
  MapPin,
  Check,
  Video,
  Layers,
  ArrowUpRight,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth, addUser, getAllUsers } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/utils/toast";

export type AuthMode = "signup" | "signin";
export type RecruiterRole = "in_house" | "freelance";

const INDUSTRY_OPTIONS = [
  "Technology & Software",
  "Staffing & Recruiting Agency",
  "E-Commerce & Retail",
  "Banking & Financial Services",
  "Healthcare & Life Sciences",
  "Digital Marketing & Media",
  "Manufacturing & Logistics",
  "Education & EdTech",
  "Other Industry",
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($) - United States Dollar" },
  { value: "PKR", label: "PKR (₨) - Pakistani Rupee" },
  { value: "GBP", label: "GBP (£) - British Pound" },
  { value: "EUR", label: "EUR (€) - Euro" },
  { value: "AED", label: "AED (د.إ) - UAE Dirham" },
  { value: "SAR", label: "SAR (﷼) - Saudi Riyal" },
  { value: "CAD", label: "CAD ($) - Canadian Dollar" },
  { value: "AUD", label: "AUD ($) - Australian Dollar" },
  { value: "INR", label: "INR (₹) - Indian Rupee" },
];

const POPULAR_TIMEZONES = [
  { value: "America/New_York", label: "America/New York (EST/EDT, UTC-5/-4)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT, UTC-6/-5)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT, UTC-7/-6)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST/PDT, UTC-8/-7)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST, UTC+0/+1)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST, UTC+1/+2)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+4)" },
  { value: "Asia/Karachi", label: "Asia/Karachi (PKT, UTC+5)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+5:30)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+8)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST, UTC+10/+11)" },
];

function detectCurrencyFromTimezone(tz: string): string {
  if (!tz) return "USD";
  if (tz.includes("Karachi") || tz.includes("Pakistan")) return "PKR";
  if (tz.startsWith("America/") || tz.startsWith("US/")) return "USD";
  if (tz.includes("London") || tz.includes("Dublin")) return "GBP";
  if (tz.startsWith("Europe/")) return "EUR";
  if (tz.includes("Dubai") || tz.includes("Muscat")) return "AED";
  if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("India")) return "INR";
  if (tz.startsWith("Australia/")) return "AUD";
  return "USD";
}

interface AuthFlowProps {
  initialMode?: AuthMode;
}

export default function AuthFlow({ initialMode = "signup" }: AuthFlowProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();
  const fromPath = (location.state as any)?.from?.pathname;

  // Mode: Sign Up vs Sign In
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Sign Up Progressive Step: 1 = Identity, 2 = Workspace Setup
  const [step, setStep] = useState<1 | 2>(1);

  // Form State - Step 1
  const [role, setRole] = useState<RecruiterRole>("in_house");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State - Step 2 (Workspace Setup)
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRY_OPTIONS[0]);
  const [officeLocation, setOfficeLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [currency, setCurrency] = useState("USD");

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-detect timezone and email from query params
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
        setCurrency(detectCurrencyFromTimezone(detected));
      }
    } catch {
      setTimezone("America/New_York");
      setCurrency("USD");
    }

    const emailQuery = searchParams.get("email");
    if (emailQuery) {
      setEmail(emailQuery);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.isAdmin) {
        navigate(fromPath && fromPath !== "/login" ? fromPath : "/admin");
      } else {
        navigate(fromPath && fromPath !== "/login" ? fromPath : "/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate, fromPath]);

  // Password strength calculation (0 to 100)
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 30;
    if (password.length >= 10) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    return Math.min(score, 100);
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (passwordStrength < 40) return { label: "Weak", color: "text-red-500", bg: "bg-red-500" };
    if (passwordStrength < 75) return { label: "Good", color: "text-amber-500", bg: "bg-amber-500" };
    return { label: "Strong", color: "text-emerald-600", bg: "bg-emerald-500" };
  }, [passwordStrength]);

  // Step 1 Validation -> Proceed to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showError("Please enter your full name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      showError("Please enter a valid work email");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match. Please verify your password.");
      return;
    }
    setStep(2);
  };

  // Step 2 Submission -> Register & Launch Workspace
  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const allUsers = getAllUsers();
      const existingUser = allUsers.find(
        (u) =>
          u.username.toLowerCase() === normalizedEmail ||
          (u.email && u.email.toLowerCase() === normalizedEmail)
      );

      if (existingUser) {
        showError("An account with this email already exists. Please sign in instead.");
        setMode("signin");
        setIsSubmitting(false);
        return;
      }

      if (role === "in_house" && !companyName.trim()) {
        showError("Please enter your company name");
        setIsSubmitting(false);
        return;
      }

      const finalCompany =
        companyName.trim() ||
        (role === "freelance" ? `${fullName.trim()} (Independent Recruiter)` : "My Company");
      const finalLocation = officeLocation.trim() || "Global Remote";

      // Register new trial user
      addUser({
        companyName: finalCompany,
        username: normalizedEmail,
        password: password,
        userType: "trial",
        fullName: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        maxScans: 50,
        maxJobs: 25,
        usageCount: 0,
        jobCount: 0,
      });

      // Save initial defaults
      try {
        localStorage.setItem("hireforce_saved_office_location", finalLocation);
        localStorage.setItem("hireforce_default_currency", currency);
        localStorage.setItem("hireforce_timezone", timezone);
        localStorage.setItem(
          "hireforce_organization_profile",
          JSON.stringify({
            companyName: finalCompany,
            officeLocation: finalLocation,
            industry,
            currency,
            timezone,
            recruiterType: role,
          })
        );
      } catch {}

      // Log in
      const success = login(normalizedEmail, password);
      if (success) {
        showSuccess(`Welcome, ${fullName.trim()}! Your 50 free AI scans are ready.`);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch {
      showError("Failed to create workspace. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign In Submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const success = login(normalizedEmail, password);

      if (success) {
        showSuccess("Signed in successfully");
        if (normalizedEmail === "admin@vision.ai") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        showError("Invalid email or password");
      }
    } catch {
      showError("An error occurred during sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#070B09] font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* =================================================================== */}
      {/* LEFT CANVAS: Reactive Live Workspace Preview (Obsidian #070B09)     */}
      {/* =================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#070B09] text-white p-8 xl:p-12 flex-col justify-between relative overflow-hidden border-r border-emerald-500/15">
        {/* Subtle Ambient Emerald Auras */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[300px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-emerald-400/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none luxury-dot-grid opacity-15" />

        {/* Top Header / Back Link */}
        <div className="relative z-10 flex items-center justify-between">
          <BrandLogo size="md" theme="dark" />

          <Link
            to="/"
            className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono"
          >
            <span>Back to website</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* CENTERPIECE: Floating Reactive 3D/Glassmorphic Preview Card */}
        <div className="relative z-10 my-auto py-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="max-w-xl mx-auto rounded-3xl bg-[#0F1713]/90 border border-emerald-500/25 p-7 backdrop-blur-2xl shadow-[0_25px_70px_-15px_rgba(4,99,7,0.35)] relative overflow-hidden"
          >
            {/* Top Laser Strike Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#10B981] to-transparent" />
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-20 bg-emerald-500/20 blur-xl pointer-events-none rounded-full" />

            {/* Header Row: Role-Reactive Pipeline Title + Pulsing Status Badge */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {role === "in_house"
                      ? "● Internal Department Pipeline: Tech Division"
                      : "● Client Agency Active Shortlist"}
                  </span>
                </motion.div>
                <div className="text-xs text-neutral-400 font-medium mt-0.5">
                  {companyName.trim()
                    ? companyName
                    : role === "in_house"
                    ? "Acme Enterprise"
                    : "Apex Staffing Partners"}
                  {role === "freelance" && " • Multi-Client Tagging Active"}
                </div>
              </div>

              {/* Pulsating Emerald Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold shrink-0 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>⚡ AI Screening Engine Active</span>
              </div>
            </div>

            {/* Industry & Quota Bar */}
            <div className="py-3 flex items-center justify-between text-xs text-neutral-400 border-b border-white/10 font-mono">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <Layers size={13} className="text-emerald-400" />
                <span>Industry: {industry}</span>
              </span>
              <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                50 Free Scans Ready
              </span>
            </div>

            {/* Live Candidate Simulation Card */}
            <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#046307] to-[#10B981] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-950/40">
                    AM
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      Alex Mercer
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded font-normal">
                        Verified CV
                      </span>
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Sr. Full-Stack Engineer • 6+ yrs exp
                    </p>
                  </div>
                </div>

                {/* 94% Match Score Badge */}
                <div className="text-right">
                  <div className="text-lg font-extrabold text-white font-mono leading-none tracking-tight flex items-baseline justify-end gap-1">
                    <span className="text-emerald-400">94%</span>
                    <span className="text-[10px] text-neutral-400 font-normal">Fit</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-medium font-mono">
                    High Recommendation
                  </span>
                </div>
              </div>

              {/* Instant CV Keyword Extraction Breakdown */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                  <span>Extracted Skills Breakdown:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-1">
                    <Check size={10} /> TypeScript (Expert)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-1">
                    <Check size={10} /> React / Next.js
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-center gap-1">
                    <Check size={10} /> Distributed Systems
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-neutral-300 text-[11px] font-mono">
                    PostgreSQL
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-neutral-300 text-[11px] font-mono">
                    AWS / Cloud
                  </span>
                </div>
              </div>

              {/* Dynamic Executive AI Summary */}
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 text-xs text-neutral-300 leading-relaxed font-sans">
                <span className="text-emerald-400 font-semibold font-mono">AI Verdict: </span>
                Candidate satisfies 5/5 mandatory knockout requirements for{" "}
                <strong className="text-white">
                  {companyName.trim()
                    ? companyName
                    : role === "in_house"
                    ? "your organization"
                    : "your client"}
                </strong>
                . Automated email invitation drafted for Google Meet.
              </div>
            </div>

            {/* Bottom Status Sync Bar */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Video size={12} className="text-emerald-400" />
                Google Meet Room Ready
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={12} />
                OAuth 2.0 Secure
              </span>
            </div>
          </motion.div>
        </div>

        {/* Left Bottom Trust Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-500">
          <span>© 2026 HireForce AI • Autonomous Talent Suite</span>
          <div>
            Platform Architecture &amp; Engineering by{" "}
            <a
              href="https://www.linkedin.com/in/raffay-asim-52bb92247/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-300 hover:text-emerald-400 font-medium transition-colors underline decoration-emerald-500/50 underline-offset-4"
            >
              Raffay Asim
            </a>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* RIGHT PANEL: Clean Minimalist Light/Neutral Mode Form (#FAFAFA)    */}
      {/* =================================================================== */}
      <div className="w-full lg:w-1/2 bg-[#FAFAFA] text-zinc-900 p-6 sm:p-10 md:p-14 lg:p-12 xl:p-16 flex flex-col justify-center min-h-screen relative overflow-y-auto">
        <div className="max-w-md w-full mx-auto my-auto">
          {/* Top Mobile Brand (Only on mobile when left panel is hidden) */}
          <div className="lg:hidden mb-6 flex items-center justify-between">
            <BrandLogo size="sm" theme="light" />
            <Link to="/" className="text-xs text-neutral-500 hover:text-emerald-600 font-mono">
              Home →
            </Link>
          </div>

          {/* STATE SWITCHER: Create Account vs Sign In */}
          <div className="bg-neutral-200/70 p-1 rounded-full flex max-w-[280px] mx-auto mb-8 relative">
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setStep(1);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-full relative z-10 transition-colors cursor-pointer ${
                mode === "signup" ? "text-neutral-900" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-full relative z-10 transition-colors cursor-pointer ${
                mode === "signin" ? "text-neutral-900" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Sign In
            </button>

            {/* Sliding Pill Indicator */}
            <motion.div
              layoutId="authTabSlider"
              className="absolute inset-y-1 rounded-full bg-white shadow-xs"
              style={{
                left: mode === "signup" ? "4px" : "50%",
                width: "calc(50% - 4px)",
              }}
              transition={{ type: "spring", stiffness: 450, damping: 35 }}
            />
          </div>

          {/* =============================================================== */}
          {/* VIEW A: CREATE ACCOUNT (PROGRESSIVE 2-STEP ONBOARDING)          */}
          {/* =============================================================== */}
          {mode === "signup" && (
            <AnimatePresence mode="wait">
              {step === 1 ? (
                /* STEP 1: IDENTITY & ROLE SELECTION */
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-emerald-800 font-bold mb-1.5">
                      <span>STEP 01 OF 02</span>
                      <span>IDENTITY &amp; CREDENTIALS</span>
                    </div>
                    {/* 2-Segment Progress Bar */}
                    <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden flex gap-1 mb-4">
                      <div className="flex-1 bg-emerald-500 rounded-full" />
                      <div className="flex-1 bg-neutral-200 rounded-full" />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A] tracking-tight">
                      Start your 50 free scans
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                      Zero credit card required. Instant automated setup.
                    </p>
                  </div>

                  {/* Role Selector Cards */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-2 font-mono uppercase tracking-wider">
                      Select Your Recruiter Role *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        onClick={() => setRole("in_house")}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          role === "in_house"
                            ? "bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/40"
                            : "bg-neutral-100/70 border-neutral-200 hover:border-neutral-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              role === "in_house"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            <Building2 size={16} />
                          </div>
                          {role === "in_house" && (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-[#0A0A0A]">In-House HR</h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                          Hiring for company roles
                        </p>
                      </div>

                      <div
                        onClick={() => setRole("freelance")}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          role === "freelance"
                            ? "bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/40"
                            : "bg-neutral-100/70 border-neutral-200 hover:border-neutral-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              role === "freelance"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            <Briefcase size={16} />
                          </div>
                          {role === "freelance" && (
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-[#0A0A0A]">Freelance Recruiter</h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                          Multiple client campaigns
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <form onSubmit={handleProceedToStep2} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                        />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Work Email *
                      </label>
                      <div className="relative">
                        <Mail
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                        />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-neutral-800">
                          Password *
                        </label>
                        {password && (
                          <span
                            className={`text-[10px] font-mono font-bold ${strengthLabel.color}`}
                          >
                            {strengthLabel.label}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                        />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimum 6 characters..."
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>

                      {/* Password Strength Meter */}
                      {password && (
                        <div className="w-full h-1 bg-neutral-200 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${strengthLabel.bg}`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                        />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password..."
                          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                    >
                      <span>Continue to Workspace Setup</span>
                      <ArrowRight size={14} className="text-emerald-400" />
                    </button>
                  </form>
                </motion.div>
              ) : (
                /* STEP 2: WORKSPACE SETUP */
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-emerald-800 font-bold mb-1.5">
                      <span>STEP 02 OF 02</span>
                      <span>WORKSPACE SETUP</span>
                    </div>
                    {/* 2-Segment Progress Bar */}
                    <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden flex gap-1 mb-4">
                      <div className="flex-1 bg-emerald-500 rounded-full" />
                      <div className="flex-1 bg-emerald-500 rounded-full" />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A] tracking-tight">
                      Configure your workspace
                    </h2>
                    <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                      Candidate emails and interview invitations will be branded with these details.
                    </p>
                  </div>

                  <form onSubmit={handleCompleteSignUp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        {role === "in_house" ? "Company Name *" : "Agency / Brand Name *"}
                      </label>
                      <div className="relative">
                        <Building2
                          size={15}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                        />
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder={
                            role === "in_house" ? "e.g. Acme Corp" : "e.g. Apex Talent Partners"
                          }
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                        />
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        Updates the candidate simulation card on the left in real time.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Hiring Industry *
                      </label>
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition cursor-pointer"
                      >
                        {INDUSTRY_OPTIONS.map((ind) => (
                          <option key={ind} value={ind}>
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Office Location / City
                        </label>
                        <div className="relative">
                          <MapPin
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                          />
                          <input
                            type="text"
                            value={officeLocation}
                            onChange={(e) => setOfficeLocation(e.target.value)}
                            placeholder="e.g. San Francisco / London"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          WhatsApp / Phone
                        </label>
                        <div className="relative">
                          <Phone
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                          />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Currency
                        </label>
                        <div className="relative">
                          <Coins
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                          />
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 transition cursor-pointer font-mono text-[11px]"
                          >
                            {CURRENCY_OPTIONS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.value} ({c.label.split(" ")[1]})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Timezone
                        </label>
                        <div className="relative">
                          <Globe
                            size={14}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                          />
                          <select
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 transition cursor-pointer font-mono text-[11px]"
                          >
                            {POPULAR_TIMEZONES.map((tz) => (
                              <option key={tz.value} value={tz.value}>
                                {tz.value.split("/")[1]?.replace("_", " ") || tz.value}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="py-3 px-4 rounded-xl bg-neutral-200/80 hover:bg-neutral-300 text-neutral-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#046307] to-[#10B981] hover:from-[#035205] hover:to-[#059669] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition cursor-pointer"
                      >
                        {isSubmitting ? (
                          <span>Launching Workspace...</span>
                        ) : (
                          <>
                            <span>Launch Free Workspace (50 Free AI Scans)</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* =============================================================== */}
          {/* VIEW B: SIGN IN STATE (DIRECT SECURE LOGIN)                     */}
          {/* =============================================================== */}
          {mode === "signin" && (
            <motion.div
              key="signin"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A] tracking-tight">
                  Welcome back
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                  Sign in to access your candidate pipeline and active jobs.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Work Email or Username *
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-neutral-300 text-xs focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight size={14} className="text-emerald-400" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Bottom Security Note & Attribution */}
          <div className="mt-8 pt-6 border-t border-neutral-200/80 text-center text-xs text-neutral-500 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>256-Bit Encrypted Recruiter Pipeline • SOC 2 Ready</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Platform Architecture &amp; Engineering by{" "}
              <a
                href="https://www.linkedin.com/in/raffay-asim-52bb92247/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 hover:text-emerald-600 font-semibold transition-colors underline decoration-emerald-500/50 underline-offset-4"
              >
                Raffay Asim
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
