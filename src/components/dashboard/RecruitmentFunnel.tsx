"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Candidate } from '@/lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface RecruitmentFunnelProps {
  candidates: Candidate[];
}

export const RecruitmentFunnel = ({ candidates }: RecruitmentFunnelProps) => {
  const totalApplied = candidates.length;
  const screened = candidates.filter(c => c.screening_score !== null).length;
  const good = candidates.filter(c => c.status === 'good').length;
  const hired = candidates.filter(c => c.status === 'hired').length;

  const data = [
    { name: 'Applied', count: totalApplied, color: '#3B82F6' },
    { name: 'Screened', count: screened, color: '#6366F1' },
    { name: 'Good Fit', count: good, color: '#10B981' },
    { name: 'Hired', count: hired, color: '#059669' },
  ];

  return (
    <Card className="glass-card rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-bold text-[#0F172A] flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <svg className="text-blue-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </div>
          Recruitment Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80}
                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '12px', 
                  border: 'none',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [`${value} candidates`, 'Count']}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-6">
          {data.map((stage) => (
            <div key={stage.name} className="text-center">
              <div className="text-2xl font-black text-[#0F172A]">{stage.count}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{stage.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};