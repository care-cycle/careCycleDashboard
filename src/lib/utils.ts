import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isAuthEnabled = () => {
  return import.meta.env.VITE_USE_AUTH === 'true';
};

export function formatDuration(ms: number): string {
  if (!ms) return '0s';
  
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  
  return `${minutes}m ${seconds}s`;
}
