"use client";

import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface TrialStatusBarProps {
  className?: string;
}

export const TrialStatusBar = ({ className }: TrialStatusBarProps) => {
  const { isTrial, getRemainingScans, user } = useAuth();

  if (!isTrial) return null;

  const remainingScans = getRemainingScans();
  const totalScans = user?.maxScans || 5;
  const usedScans = totalScans - remainingScans;
  const progressPercentage = (usedScans / totalScans) * 100;

  const isLow = remainingScans <= 2;
  const isExhausted = remainingScans === 0;

  return (
    <div className={cn("p-4 rounded-2xl border", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className={cn("w-4 h-4", isExhausted ? "text-slate-400" : "text-emerald-500")} />
          <span className={cn("text-sm font-bold", isExhausted ? "text-slate-500" : "text-emerald-800")}>
            Trial Status
          </span>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "rounded-full text-xs font-bold",
            isExhausted ? "bg-slate-100 text-slate-500 border-slate-200" :
            isLow ? "bg-amber-100 text-amber-700 border-amber-200" :
            "bg-emerald-100 text-emerald-700 border-emerald-200"
          )}
        >
          {isExhausted ? 'Expired' : `${remainingScans} Left`}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className={cn("font-medium", isExhausted ? "text-slate-400" : "text-emerald-700/70")}>
            {usedScans} of {totalScans} scans used
          </span>
          <span className={cn("font-bold", isExhausted ? "text-slate-400" : isLow ? "text-amber-600" : "text-emerald-600")}>
            {remainingScans} remaining
          </span>
        </div>
        
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={cn(
              "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
              isExhausted ? "bg-slate-300" :
              isLow ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {isLow && !isExhausted && (
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 font-medium">
            <AlertCircle size={12} />
            <span>Running low on scans</span>
          </div>
        )}

        {isExhausted && (
          <div className="text-xs text-slate-500 mt-2 font-medium text-center">
            Trial limit reached. Upgrade to continue.
          </div>
        )}
      </div>
    </div>
  );
};