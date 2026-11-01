import React from 'react';
import { useRole } from '@/contexts/RoleContext';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, ShieldCheck } from 'lucide-react';

export const RoleSwitcher = () => {
  const { isAdmin, isViewer, setUserRole } = useRole();

  return (
    <div className="p-2.5 bg-zinc-800/70 rounded-md border border-zinc-700/60 text-zinc-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Access Level</span>
        <div className="flex items-center gap-1.5">
          {isViewer ? <Eye size={12} className="text-amber-400" /> : <ShieldCheck size={12} className="text-emerald-400" />}
          <span className={`text-[11px] font-medium ${isViewer ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isAdmin ? 'Full Admin' : 'Viewer'}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="role-switch" className="text-xs text-zinc-300 cursor-pointer">
          {isAdmin ? 'Admin Mode' : 'Read Only'}
        </Label>
        <Switch 
          id="role-switch"
          checked={isAdmin}
          onCheckedChange={(checked) => setUserRole(checked ? 'admin' : 'viewer')}
          className="data-[state=checked]:bg-emerald-500 scale-90"
        />
      </div>
    </div>
  );
};
