import React, { useState } from 'react';
import { X, Calendar, ArrowRight } from 'lucide-react';
import { RepItem } from '../types.ts';

interface AppointmentModalProps {
  isOpen: boolean;
  availableReps: RepItem[];
  onClose: () => void;
  onAssign: (repId: string, note?: string) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  availableReps,
  onClose,
  onAssign,
}) => {
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedRepId) return;
    onAssign(selectedRepId, note.trim() || undefined);
    setNote('');
    setSelectedRepId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Assign Note / Request</h3>
              <p className="text-xs text-slate-400">Add an optional note or request</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Name
            </label>
            {availableReps.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center text-xs text-slate-400">
                No names currently available.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {availableReps.map((rep) => {
                  const isSelected = selectedRepId === rep.id;
                  return (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => setSelectedRepId(rep.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-500/15 border-teal-500 text-white shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center">
                          {rep.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{rep.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {rep.upCount} {rep.upCount === 1 ? 'up' : 'ups'}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Miller, Reserved..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedRepId}
            onClick={handleConfirm}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition active:scale-95 ${
              selectedRepId
                ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer shadow-md'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>Assign</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
