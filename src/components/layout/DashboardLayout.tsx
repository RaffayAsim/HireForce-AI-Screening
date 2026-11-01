import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Settings,
  Shield,
  Sparkles,
  Search,
  Menu,
  X,
  ExternalLink,
  Calendar,
  Mail,
  Zap,
  Building2,
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { TrialStatusBar } from '@/components/trial/TrialStatusBar';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import { getConnectedAccount, isEmailConnected, isCalendarConnected, disconnectAccount, ConnectedRecruiterAccount } from '@/lib/connectedAccountService';

interface SidebarItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  to: string;
  badge?: string | number;
  warn?: boolean;
}

const SidebarItem = ({ icon: Icon, label, to, badge, warn }: SidebarItemProps) => {
  const location = useLocation();
  const currentPathWithSearch = location.pathname + location.search;

  // Accurate active state matching for both query parameters and clean routes
  const isActive = (() => {
    if (to === '/admin') {
      return location.pathname === '/admin' && (!location.search || location.search === '?tab=overview');
    }
    if (to.startsWith('/admin?tab=')) {
      return location.pathname === '/admin' && currentPathWithSearch === to;
    }
    if (to.includes('?')) {
      return currentPathWithSearch === to;
    }
    return location.pathname === to || (to !== '/dashboard' && to !== '/admin' && location.pathname.startsWith(to));
  })();
  
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all text-sm font-medium",
        isActive 
          ? "bg-emerald-500/15 text-emerald-400 font-semibold shadow-2xs border border-emerald-500/30" 
          : "text-zinc-300 hover:text-white hover:bg-zinc-800/60"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon size={18} className={cn(isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-200")} />
        <span className="truncate">{label}</span>
      </div>
      {badge && (
        <span className={cn(
          "px-2 py-0.5 rounded-full text-xs font-semibold",
          isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-400"
        )}>
          {badge}
        </span>
      )}
      {warn && (
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      )}
    </Link>
  );
};

const DashboardLayout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isTrial, isAdmin, user, quotaStatus } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connectedAcc, setConnectedAcc] = useState<ConnectedRecruiterAccount | null>(() => getConnectedAccount(user?.id));
  
  const isAdminPath = location.pathname.startsWith('/admin');

  React.useEffect(() => {
    const acc = getConnectedAccount(user?.id);
    if (user?.userType === 'trial' && acc?.email?.toLowerCase().includes('angellagarland')) {
      disconnectAccount(user?.id);
      setConnectedAcc(null);
    } else {
      setConnectedAcc(acc);
    }
  }, [user?.id, user?.userType]);

  React.useEffect(() => {
    const handleUpdate = () => {
      const acc = getConnectedAccount(user?.id);
      if (user?.userType === 'trial' && acc?.email?.toLowerCase().includes('angellagarland')) {
        disconnectAccount(user?.id);
        setConnectedAcc(null);
      } else {
        setConnectedAcc(acc);
      }
    };
    window.addEventListener('unified_account_updated', handleUpdate);
    return () => window.removeEventListener('unified_account_updated', handleUpdate);
  }, [user?.id, user?.userType]);
  
  // Recruiter navigation (candidates, jobs, calendar, emails, automations)
  const recruiterNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
    { icon: Briefcase, label: 'Job Openings', to: '/jobs', warn: quotaStatus?.jobsExhausted },
    { icon: Users, label: 'Candidates & Pipeline', to: '/talent-pool' },
    { icon: Calendar, label: 'Calendar', to: '/calendar' },
    { icon: Mail, label: 'Emails', to: '/emails' },
    { icon: Zap, label: 'Automations', to: '/automations' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  // Dedicated Platform Administration navigation for Admin Control Tower
  const adminNavItems = [
    { icon: Shield, label: 'Control Tower', to: '/admin', badge: 'Overview' },
    { icon: Sparkles, label: 'Trial Registrations', to: '/admin?tab=trials' },
    { icon: Building2, label: 'Pro Tenants', to: '/admin?tab=pro' },
    { icon: Server, label: 'AI Screening Engine', to: '/admin?tab=engine' },
    { icon: Database, label: 'Database & Cloud', to: '/admin?tab=system' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex text-zinc-900 font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-40" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Dark Charcoal Sidebar (Adaptive: Recruiter Workspace vs Admin Control Tower) */}
      <aside className={cn(
        "w-64 bg-[#18181B] text-zinc-200 border-r border-zinc-800/80 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-zinc-800/80 flex items-center justify-between">
          <BrandLogo
            size="sm"
            theme="dark"
            to={isAdminPath ? "/admin" : "/dashboard"}
            badgeText={isAdminPath ? "ADMIN" : "AI"}
            subtitle={isAdminPath ? "Platform Governance" : "Screening Engine"}
          />
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden p-1 text-zinc-400 hover:text-white rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Navigation Links based on Mode */}
        <div className="px-3 py-3">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-3.5 mb-2">
            {isAdminPath ? 'Platform Admin' : 'Recruiter Workspace'}
          </div>
          <nav className="space-y-1">
            {(isAdminPath ? adminNavItems : recruiterNavItems).map((item) => (
              <SidebarItem key={item.to} {...item} />
            ))}
          </nav>
        </div>

        {/* IF IN ADMIN VIEW: Quick Link to Recruiter Workspace */}
        {isAdminPath && (
          <div className="px-3 pt-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3.5 mb-1.5">
              Recruiter View
            </div>
            <Link
              to="/dashboard"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard size={15} className="text-emerald-400" />
                <span>Exit to Recruiter App</span>
              </div>
              <ArrowRight size={13} className="text-zinc-500 group-hover:translate-x-0.5 group-hover:text-emerald-400 transition-all" />
            </Link>
          </div>
        )}

        {/* IF IN RECRUITER VIEW AND USER IS ADMIN: One-click Switch to Admin Tower */}
        {!isAdminPath && isAdmin && (
          <div className="px-3 pt-2">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3.5 mb-1.5">
              Superadmin Mode
            </div>
            <Link
              to="/admin"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-400 transition-all group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-amber-400" />
                <span>Admin Control Tower</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold uppercase">
                Panel →
              </span>
            </Link>
          </div>
        )}

        <div className="flex-1" />

        {/* Trial Status or Plan Meter (only in recruiter view for trial accounts) */}
        {!isAdminPath && isTrial && (
          <div className="px-3 mb-3">
            <div className="p-3 rounded-md bg-zinc-900 border border-zinc-800">
              <TrialStatusBar className="p-0 border-0 bg-transparent text-zinc-300" />
            </div>
          </div>
        )}

        {/* User Footer Profile & Role Switcher */}
        <div className="p-3 border-t border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate">
                {isAdminPath ? 'Superadmin Platform' : (user?.companyName || 'HireForce Team')}
              </p>
              <p className="text-xs text-zinc-400 truncate">{user?.username || 'admin@vision.ai'}</p>
            </div>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
              isAdminPath 
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
                : "bg-zinc-800 text-emerald-400 border-zinc-700"
            )}>
              {isAdminPath ? 'Superadmin' : (user?.userType || 'pro')}
            </span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 transition-all w-full text-sm font-medium cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-2 rounded-md text-zinc-600 hover:bg-zinc-100"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-medium text-zinc-800">HireForce</span>
              <span>/</span>
              <span className="capitalize text-zinc-600">
                {isAdminPath ? 'Admin Governance' : (location.pathname.replace('/', '') || 'Overview')}
              </span>
            </div>
          </div>

          {/* Quick Search & Status Indicators */}
          <div className="flex items-center gap-3">
            {isAdminPath ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Supabase Authority Active
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                  <ShieldCheck size={12} className="text-amber-600" />
                  Superadmin Privileges
                </div>
              </div>
            ) : (
              <>
                <div className="relative hidden md:block w-64 lg:w-80">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search candidates, jobs, criteria..." 
                    className="w-full h-9 pl-9 pr-4 text-sm rounded-md bg-zinc-50 border border-zinc-200 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  AI Engine Online
                </div>
              </>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Quota Notification for Trial Users */}
            {!isAdminPath && isTrial && (quotaStatus?.scansExhausted || quotaStatus?.jobsExhausted) && (
              <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Trial Limit Reached</p>
                  <p className="text-xs text-amber-700">Upgrade your subscription to unlock unlimited job postings and candidate AI screenings.</p>
                </div>
                <button
                  onClick={() => navigate('/#pricing')}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}

            {children || <Outlet />}
          </div>

          {/* Recruiter Workspace Footer Attribution */}
          <footer className="mt-14 pt-6 border-t border-zinc-200/80 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-700">HireForce AI Recruiter Workspace</span>
              <span className="text-zinc-300">•</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Autonomous Talent Screening
              </span>
            </div>
            <div>
              Platform Architecture &amp; Engineering by{" "}
              <a
                href="https://www.linkedin.com/in/raffay-asim-52bb92247/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-900 font-semibold hover:text-emerald-600 transition-colors underline decoration-emerald-500/50 underline-offset-4"
              >
                Raffay Asim
              </a>
            </div>
          </footer>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
