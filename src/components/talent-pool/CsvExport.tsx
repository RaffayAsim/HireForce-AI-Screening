"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check } from 'lucide-react';
import { Candidate } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';

interface CsvExportProps {
  candidates: Candidate[];
  jobTitle: string;
}

export const CsvExport = ({ candidates, jobTitle }: CsvExportProps) => {
  const [exported, setExported] = useState(false);

  const generateCSV = () => {
    // CSV Headers
    const headers = ['Name', 'Email', 'LinkedIn', 'AI Score', 'AI Reasoning', 'Status', 'Applied Date'];
    
    // CSV Rows
    const rows = candidates.map(candidate => [
      candidate.full_name || '',
      candidate.email || '',
      candidate.linkedin || '',
      candidate.screening_score !== null ? candidate.screening_score.toString() : 'N/A',
      candidate.screening_summary ? `"${candidate.screening_summary.replace(/"/g, '""')}"` : 'N/A',
      candidate.status || 'new',
      candidate.created_at ? new Date(candidate.created_at).toLocaleDateString() : 'N/A'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
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
    
    setTimeout(() => setExported(false), 3000);
  };

  return (
    <Button
      onClick={generateCSV}
      className="h-12 px-6 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold gap-2"
    >
      {exported ? <Check size={18} /> : <Download size={18} />}
      {exported ? 'Exported!' : `Export ${candidates.length} to CSV`}
    </Button>
  );
};