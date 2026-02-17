"use client";

import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Settings, 
  Zap,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Briefcase, label: 'Job Openings', path: '/jobs' },
    { icon: Users, label: 'Talent Pool', path: '/talent-pool' },
    { icon: Settings, label: 'Organization', path: '/settings' },
  ];

  // Check if current path is active (including sub-routes)
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 sidebar-glass text-white flex flex-col z-50">
      <div className="p-10 flex items-center gap-3">
        <div className="w-11 h-11 vision-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 ring-1 ring-white/20">
          <Zap className="text-white fill-white" size={22} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight leading-none">Vision</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mt-1">Factory</span>
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400 mb-1">Logged in as</p>
          <p className="text-sm font-bold text-white truncate">{user?.companyName || user?.username}</p>
        </div>
      </div>

      <nav className="flex-1 px-6 space-y-2 mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/50 mb-4 px-4">Main Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group",
              isActive(item.path)
                ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                : "text-emerald-100/70 hover:text-white hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={cn("transition-transform duration-300 group-hover:scale-110")} />
              <span className="font-semibold text-sm">{item.label}</span>
            </div>
            <ChevronRight size={14} className={cn("opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0", isActive(item.path) && "opacity-100 translate-x-0")} />
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-white/5 rounded-3xl p-5 mb-6 border border-white/10">
          <p className="text-xs text-emerald-200/70 font-medium mb-3">Current Plan</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-white">Enterprise AI</span>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">PRO</span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div className="vision-gradient h-full w-[85%] rounded-full" />
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-emerald-100/70 hover:text-white hover:bg-white/5 transition-colors group rounded-2xl"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;