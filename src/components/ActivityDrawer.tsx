import React from 'react';
import { X, History, UserCheck, Calendar, RefreshCw, Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { ActivityEvent } from '../types.ts';

interface ActivityDrawerProps {
  isOpen: boolean;
  activity: ActivityEvent[];
  onClose: () => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  isOpen,
  activity,
  onClose,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'walkin':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'appointment':
        return <Calendar className="w-3.5 h-3.5 text-teal-400" />;
      case 'add':
        return <Plus className="w-3.5 h-3.5 text-blue-400" />;
      case 'remove':
        return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
      case 'reorder':
        return <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />;
      case 'reset':
      case 'undo':
        return <RefreshCw className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-xs">
      <div
        className="w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Activity</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {activity.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No activity recorded yet today.
            </div>
          ) : (
            activity.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-850/80 border border-slate-800/80 flex items-start space-x-3 text-xs"
              >
                <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60 mt-0.5 flex-shrink-0">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 font-medium leading-relaxed">
                    {item.text}
                  </p>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
