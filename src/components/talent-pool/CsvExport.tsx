"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Check } from 'lucide-react';
import { Candidate } from '@/lib/supabase';
import { showSuccess } from '@/utils/toast';

interface CsvExportProps {
  candidates: Candidate[];
  jobTitle: string;
}

export const CsvExport = ({ candidates, jobTitle }: CsvExportProps) => {
  const [exported, setExported] = useState(false);

  const generateCSV = () => {
    if (candidates.length === 0) {
      showSuccess("No candidates to export");
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'LinkedIn', 'AI Score', 'AI Reasoning', 'Status', 'Applied Date'];
    
    const rows = candidates.map(candidate => [
      `"${candidate.full_name || ''}"`,
      `"${candidate.email || ''}"`,
      `"${candidate.phone || ''}"`,
      `"${candidate.linkedin || ''}"`,
      candidate.screening_score !== null ? candidate.screening_score.toString() : 'N/A',
      `"${(candidate.screening_summary || '').split('<!-- RESUME_TEXT_CACHE -->')[0].replace(/\[Engine:[^\]]+\]/gi, '').trim().replace(/"/g, '""')}"`,
      `"${candidate.status || 'new'}"`,
      `"${candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'N/A'}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${jobTitle.replace(/\s+/g, '_')}_candidates_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setExported(true);
    showSuccess(`Exported ${candidates.length} candidates to CSV`);
    setTimeout(() => setExported(false), 2500);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generateCSV}
      className="h-8 px-2.5 rounded-md border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 gap-1.5 transition-all shadow-xs"
    >
      {exported ? <Check size={13} className="text-emerald-600" /> : <Download size={13} />}
      <span>{exported ? 'Exported' : `Export (${candidates.length})`}</span>
    </Button>
  );
};
