import React, { useState } from 'react';
import { UserPlus, Plus, Check, Clock, Trash2, Moon } from 'lucide-react';
import { RepItem } from '../types.ts';

interface QuickClockInProps {
  presets: string[];
  activeReps: RepItem[];
  onAddRep: (name: string) => void;
  onEditPresets: () => void;
  onReset: (mode: 'daily_reset' | 'clear') => void;
}

export const QuickClockIn: React.FC<QuickClockInProps> = ({
  presets,
  activeReps,
  onAddRep,
  onEditPresets,
  onReset,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onAddRep(nameInput.trim());
    setNameInput('');
  };

  const handleClearBoard = () => {
    if (confirmClear) {
      setConfirmClear(false);
      onReset('clear');
    } else {
      setConfirmClear(true);
      setTimeout(() => {
        setConfirmClear(false);
      }, 4500);
    }
  };

  const isRepActive = (name: string) => {
    return activeReps.some((r) => r.name.toLowerCase() === name.toLowerCase());
  };

  return (
    <div className="space-y-3">
      {/* Board Controls (Moved from menu to above 'Add name' bar) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Daily Reset (Ups & Floor Times) */}
          <button
            type="button"
            onClick={() => onReset('daily_reset')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Zeroes all up counts and resets floor timer to 0m"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Daily Reset</span>
          </button>

          {/* Clear Board with 2-step in-UI confirmation (reliable in iframes & mobile) */}
          {confirmClear ? (
            <div className="inline-flex items-center space-x-1">
              <button
                type="button"
                onClick={handleClearBoard}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 transition-all active:scale-95 cursor-pointer shadow-sm animate-pulse"
                title="Tap again to confirm clearing board"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
                <span>Confirm Clear?</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
                title="Cancel"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClearBoard}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/50 hover:border-rose-500/30 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Removes all names from the board"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Board</span>
            </button>
          )}
        </div>

        {/* Midnight Auto-Reset Active (Always On) */}
        <div
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400"
          title="Daily midnight auto-reset runs automatically every night at 12:00 AM"
        >
          <Moon className="w-3 h-3 text-emerald-400" />
          <span>Midnight Auto-Reset Active (12:00 AM)</span>
        </div>
      </div>

      {/* Search & Custom Add Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Add name..."
            className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
            autoComplete="off"
            autoCapitalize="words"
          />
        </div>
        <button
          type="submit"
          disabled={!nameInput.trim()}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
            nameInput.trim()
              ? 'bg-slate-100 text-slate-950 hover:bg-white cursor-pointer shadow-md'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Preset Roster Quick-Tap Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <div className="flex items-center space-x-1.5">
          {presets.map((presetName) => {
            const active = isRepActive(presetName);
            return (
              <button
                key={presetName}
                onClick={() => {
                  if (!active) {
                    onAddRep(presetName);
                  }
                }}
                disabled={active}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-1 ${
                  active
                    ? 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-default'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700/80 hover:text-white border border-slate-700/60 cursor-pointer active:scale-95'
                }`}
              >
                {active ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{presetName}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>{presetName}</span>
                  </>
                )}
              </button>
            );
          })}

          <button
            onClick={onEditPresets}
            className="px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-dashed border-slate-700 hover:border-slate-500 whitespace-nowrap transition-all"
            title="Edit store roster presets"
          >
            Edit Roster
          </button>
        </div>
      </div>
    </div>
  );
};
