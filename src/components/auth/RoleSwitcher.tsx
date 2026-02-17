import React from 'react';
import { useRole } from '@/contexts/RoleContext';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, Lock } from 'lucide-react';

export const RoleSwitcher = () => {
  const { isAdmin, isViewer, setUserRole } = useRole();

  return (
    <div className="p-4 bg-white/50 rounded-2xl border border-slate-200/60">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</span>
        <div className="flex items-center gap-2">
          {isViewer ? <Eye size={14} className="text-amber-500" /> : <Lock size={14} className="text-emerald-600" />}
          <span className={`text-xs font-bold ${isViewer ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isAdmin ? 'Admin' : 'Viewer'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch 
          checked={isAdmin}
          onCheckedChange={(checked) => setUserRole(checked ? 'admin' : 'viewer')}
        />
        <Label className="text-sm font-medium text-slate-700 cursor-pointer">
          {isAdmin ? 'Full Access' : 'Read Only'}
        </Label>
      </div>
    </div>
  );
};