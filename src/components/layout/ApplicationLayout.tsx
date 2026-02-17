import React from 'react';
import { Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const ApplicationLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Building2 className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-black text-[#0F172A] tracking-tight">HireForce</h1>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-12 px-6">
        <div className="max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ApplicationLayout;