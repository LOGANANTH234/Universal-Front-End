'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  isLoading: boolean;
  title?: string;
  description?: string;
  accentColor?: 'amber' | 'blue' | 'emerald' | 'indigo';
}

export function PageLoader({
  isLoading,
  title = 'Loading...',
  description = 'Please wait while records are being fetched and processed',
  accentColor = 'amber',
}: PageLoaderProps) {
  if (!isLoading) return null;

  const colorStyles = {
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
  }[accentColor];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px] animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-7 shadow-2xl flex flex-col items-center gap-3.5 max-w-sm text-center mx-4">
        <div
          className={`w-14 h-14 rounded-2xl ${colorStyles.bg} border ${colorStyles.border} flex items-center justify-center ${colorStyles.text} shadow-sm`}
        >
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>
        {/* Subtle animated bar */}
        <div className="w-full h-1 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
          <div className={`h-full ${accentColor === 'amber' ? 'bg-amber-500' : accentColor === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse w-full`} />
        </div>
      </div>
    </div>
  );
}
