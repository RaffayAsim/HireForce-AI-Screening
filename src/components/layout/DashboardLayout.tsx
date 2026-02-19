import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Users, 
  LayoutDashboard, 
  LogOut, 
  Settings,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleSwitcher } from '@/components/auth/RoleSwitcher';
import { TrialStatusBar } from '@/components/trial/TrialStatusBar';
import { useAuth } from '@/contexts/AuthContext';

const SidebarItem = ({ icon: Icon, label, to, badge }: any) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
        isActive 
          ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20" 
          : "hover:bg-white/60 text-slate-600 hover:text-slate-900"
      )}
    >
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className="relative z-10 font-bold text-sm">{label}</span>
      {badge && (
        <span className={cn(
          "relative z-10 ml-auto px-2 py-0.5 rounded-full text-xs font-bold",
          isActive ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600"
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
};

const DashboardLayout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isTrial, quotaStatus } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Briefcase, label: 'Jobs', to: '/jobs', warn: quotaStatus?.jobsExhausted },
    { icon: Users, label: 'Talent Pool', to: '/talent-pool' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 md:hidden z-10" onClick={() => setSidebarOpen(false)} />
      )}
      
      <aside className={`w-72 bg-[#F1F5F9] border-r border-slate-200/60 flex flex-col fixed h-screen z-20 transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative}`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-200/60">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[1rem] flex items-center justify-center shadow-xl shadow-emerald-600/20 group-hover:scale-110 transition-transform duration-300">
              <Building2 className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#0F172A] tracking-tight leading-none">HireForce</h1>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">The Smart Way</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Trial Status Bar - Only for trial users */}
        {isTrial && (
          <div className="px-4 mb-4">
            <TrialStatusBar className="bg-white/70 border-emerald-200/50" />
          </div>
        )}

        {/* Role Switcher & User */}
        <div className="p-4 border-t border-slate-200/60 space-y-3">
          <RoleSwitcher />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all w-full font-bold text-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200/50 flex items-center justify-center">
              <LogOut size={18} />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-6 lg:p-8 overflow-y-auto min-h-screen">
        <div className="flex md:hidden mb-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        <div className="max-w-7xl mx-auto">
          {/* Global trial banner - appears on all pages for trial users when quota exhausted */}
          {isTrial && (quotaStatus?.scansExhausted || quotaStatus?.jobsExhausted) && (
            <div className="mb-6 rounded-lg border-2 border-rose-400 bg-rose-50/40 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-rose-700">Trial quota finished</p>
                <p className="text-xs text-rose-700/90">Don't worry — get 20% off your first month when you upgrade.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.open('https://hireforce-amber.vercel.app/#get-started', '_blank')}
                  className="px-4 py-2 bg-rose-600 text-white rounded-2xl text-sm font-bold hover:bg-rose-700"
                >
                  Get Started Today
                </button>
                <button
                  onClick={() => window.open('https://hireforce-amber.vercel.app/#get-started', '_blank')}
                  className="px-3 py-2 bg-white border border-rose-200 text-rose-700 rounded-2xl text-sm font-semibold hover:bg-rose-50"
                >
                  Get Started Today
                </button>
              </div>
            </div>
          )}

          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;