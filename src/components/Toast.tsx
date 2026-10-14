import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-150">
      <div className="bg-slate-900/95 text-slate-100 border border-slate-700/80 text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center space-x-2">
        {type === 'success' ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-teal-400" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};
