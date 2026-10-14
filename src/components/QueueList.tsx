import React from 'react';
import {
  Check,
  ArrowUp,
  ArrowDown,
  Trash2,
  Coffee,
} from 'lucide-react';
import { RepItem } from '../types.ts';

interface QueueListProps {
  reps: RepItem[];
  onToggle: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onRemove: (id: string) => void;
  onSetStatus: (id: string, status: RepItem['status']) => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  reps,
  onToggle,
  onMove,
  onRemove,
  onSetStatus,
}) => {
  const availableReps = reps.filter((r) => !r.checked);
  const busyReps = reps.filter((r) => r.checked);

  const formatElapsed = (timestamp: number) => {
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Available Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-200 tracking-tight">
              Available
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {availableReps.length}
            </span>
          </div>
        </div>

        {availableReps.length === 0 ? (
          <div className="py-10 px-4 text-center text-xs text-slate-400">
            No names currently available.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {availableReps.map((rep, index) => {
              const isBreak = rep.status === 'break';

              return (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3.5 sm:px-4 py-3 sm:py-3.5 transition-all hover:bg-slate-800/40 group"
                >
                  {/* Left: Circle Checkbox on the far left replacing the letter icon */}
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1 pr-2">
                    {/* Circle Checkbox on the left */}
                    <button
                      type="button"
                      onClick={() => onToggle(rep.id)}
                      className="w-10 h-10 rounded-full border-2 border-slate-600 hover:border-emerald-400 bg-slate-900/90 hover:bg-emerald-500/15 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 active:scale-95 group/check shadow-sm"
                      aria-label={`Check ${rep.name}`}
                    >
                      <Check className="w-5 h-5 text-emerald-400 opacity-0 group-hover/check:opacity-60 transition-opacity stroke-[3]" />
                    </button>

                    {/* Name & Trackers */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-semibold text-slate-100 truncate">
                          {rep.name}
                        </span>
                        {isBreak && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Away
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                        <span>on floor {formatElapsed(rep.statusChangedAt)}</span>
                        <span>•</span>
                        <span>{rep.upCount} {rep.upCount === 1 ? 'up' : 'ups'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Tools */}
                  <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                    {/* Manual reorder nudges */}
                    <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onMove(rep.id, 'up')}
                        disabled={index === 0}
                        title="Move up"
                        className={`p-1.5 rounded transition-colors ${
                          index === 0
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onMove(rep.id, 'down')}
                        disabled={index === availableReps.length - 1}
                        title="Move down"
                        className={`p-1.5 rounded transition-colors ${
                          index === availableReps.length - 1
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Set Break / Away */}
                    <button
                      onClick={() => onSetStatus(rep.id, 'break')}
                      title="Away"
                      className="p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    >
                      <Coffee className="w-4 h-4" />
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => onRemove(rep.id)}
                      title="Remove"
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Assisting Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200 tracking-tight">
              Assisting
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700/80">
              {busyReps.length}
            </span>
          </div>
        </div>

        {busyReps.length === 0 ? (
          <div className="py-8 px-4 text-center text-xs text-slate-400">
            None checked.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {busyReps.map((rep) => {
              const isBreak = rep.status === 'break';

              return (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-3.5 sm:px-4 py-3 sm:py-3.5 transition-all hover:bg-slate-800/30 group"
                >
                  {/* Left: Checked Circle Checkbox on the far left replacing the letter icon */}
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1 pr-2">
                    {/* Checked Circle Checkbox on the left */}
                    <button
                      type="button"
                      onClick={() => onToggle(rep.id)}
                      className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-emerald-400 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-md shadow-emerald-500/25 active:scale-95"
                      aria-label={`Uncheck ${rep.name}`}
                    >
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3.5]" />
                    </button>

                    {/* Name & Trackers */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-medium text-slate-300 truncate">
                          {rep.name}
                        </span>
                        {isBreak && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Away
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                        <span>assisting {formatElapsed(rep.statusChangedAt)}</span>
                        <span>•</span>
                        <span>{rep.upCount} {rep.upCount === 1 ? 'up' : 'ups'}</span>
                        {rep.note && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 italic truncate max-w-[140px] sm:max-w-xs">{rep.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => onRemove(rep.id)}
                      title="Remove"
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
