"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Mail, ArrowRight, Crown } from 'lucide-react';

interface TrialLimitModalProps {
  open: boolean;
  onClose: () => void;
  type: 'scan' | 'job';
}

export const TrialLimitModal = ({ open, onClose, type }: TrialLimitModalProps) => {
  const title = type === 'scan' ? 'Scan Limit Reached!' : 'Job Limit Reached!';
  const description = type === 'scan' 
    ? "You've used all 5 AI-powered candidate scans in your trial."
    : "You've reached the maximum of 1 job posting in your trial.";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl bg-white/95 backdrop-blur-2xl p-0 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
        
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/20">
            <Crown className="text-emerald-600" size={40} />
          </div>
          
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-[#0F2E1F] tracking-tight mb-2">
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-base">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-slate-600 leading-relaxed">
              We hope you enjoyed the Hire Force experience! To unlock unlimited scans, multiple job postings, and use your own database, upgrade to Pro today.
            </p>

            <div className="bg-emerald-50/70 rounded-2xl border border-emerald-100 p-6 text-left">
              <p className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                <Sparkles size={16} />
                Pro Plan Includes:
              </p>
              <ul className="text-sm text-emerald-700/70 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Unlimited AI candidate scans
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Unlimited job postings
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Custom n8n & Supabase integration
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Priority support
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                className="h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-emerald-600/20 gap-2"
                onClick={() => window.location.href = 'mailto:sales@hireforce.com'}
              >
                <Mail size={18} />
                Contact Sales Team
              </Button>
              
              <Button 
                variant="outline" 
                className="h-12 rounded-2xl font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-2"
                onClick={onClose}
              >
                Maybe Later
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};