import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(salary?: string | null): string {
  if (!salary) return '';
  const trimmed = salary.trim();
  if (!trimmed) return '';
  const defaultCurrency = (typeof window !== 'undefined' ? localStorage.getItem('hireforce_default_currency') : null) || 'PKR';
  if (/^PKR/i.test(trimmed)) {
    return trimmed.replace(/^PKRs*/i, `${defaultCurrency} `);
  }
  if (/^\$/i.test(trimmed)) {
    return trimmed.replace(/^\$\s*/, `${defaultCurrency} `);
  }
  if (/^(USD|EUR|GBP|AED|SAR|INR|CAD|AUD)\b/i.test(trimmed)) {
    return trimmed;
  }
  return `${defaultCurrency} ${trimmed}`;
}
