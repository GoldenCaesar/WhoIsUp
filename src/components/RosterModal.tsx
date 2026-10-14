import React, { useState } from 'react';
import { X, Plus, Trash2, Users } from 'lucide-react';

interface RosterModalProps {
  isOpen: boolean;
  presets: string[];
  onClose: () => void;
  onUpdatePresets: (newPresets: string[]) => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  presets,
  onClose,
  onUpdatePresets,
}) => {
  const [newPresetName, setNewPresetName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    const clean = newPresetName.trim();
    if (!presets.includes(clean)) {
      onUpdatePresets([...presets, clean]);
    }
    setNewPresetName('');
  };

  const handleRemove = (nameToRemove: string) => {
    onUpdatePresets(presets.filter((p) => p !== nameToRemove));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Quick Names</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-2 mb-3">
          Manage quick-tap name buttons.
        </p>

        {/* Add new preset form */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Add staff member name..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!newPresetName.trim()}
            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold disabled:opacity-40 flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* List of current presets */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {presets.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-850 border border-slate-800 text-xs text-slate-200"
            >
              <span className="font-medium">{name}</span>
              <button
                type="button"
                onClick={() => handleRemove(name)}
                className="text-slate-500 hover:text-rose-400 transition"
                title={`Remove ${name} from presets`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
