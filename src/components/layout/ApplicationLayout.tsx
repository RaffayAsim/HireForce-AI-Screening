import React from 'react';
import { Outlet } from 'react-router-dom';
import { BrandLogo } from '@/components/brand/BrandLogo';

const ApplicationLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-center">
          <BrandLogo size="md" theme="light" />
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
