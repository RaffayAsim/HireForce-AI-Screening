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
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-semibold",
        isActive 
          ? "bg-cyan-500 text-white" 
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <Icon size={18} />
      <span>{label}</span>
      {badge && (
        <span className={cn(
          "ml-auto px-2 py-0.5 rounded text-xs font-bold",
          isActive ? "bg-white/30 text-white" : "bg-cyan-100 text-cyan-700"
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
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 md:hidden z-10" onClick={() => setSidebarOpen(false)} />
      )}
      
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen z-20 transform transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative}`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-cyan-500 rounded flex items-center justify-center">
              <Building2 className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">HireForce</h1>
              <p className="text-xs font-semibold text-gray-500 uppercase">The Smart Way</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem key={item.to} {...item} />
          ))}
        </nav>

        {/* Trial Status Bar - Only for trial users */}
        {isTrial && (
          <div className="px-3 mb-3">
            <TrialStatusBar className="bg-gray-50 border-gray-200" />
          </div>
        )}

        {/* Role Switcher & User */}
        <div className="p-3 border-t border-gray-200 space-y-2">
          <RoleSwitcher />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all w-full font-semibold text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-6 lg:p-8 overflow-y-auto min-h-screen bg-gray-50">
        <div className="flex md:hidden mb-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        <div className="max-w-7xl mx-auto">
          {/* Global trial banner - appears on all pages for trial users when quota exhausted */}
          {isTrial && (quotaStatus?.scansExhausted || quotaStatus?.jobsExhausted) && (
            <div className="mb-6 rounded-lg border border-orange-300 bg-orange-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-orange-800">Trial quota finished</p>
                <p className="text-xs text-orange-700">Don't worry — get 20% off your first month when you upgrade.</p>
              </div>
              <button
                onClick={() => window.open('https://hireforce-amber.vercel.app/#get-started', '_blank')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600"
              >
                Upgrade Now
              </button>
            </div>
          )}

          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;