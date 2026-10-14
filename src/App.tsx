import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QueueState, RepItem } from './types.ts';
import { Header } from './components/Header.tsx';
import { QuickClockIn } from './components/QuickClockIn.tsx';
import { QueueList } from './components/QueueList.tsx';
import { AppointmentModal } from './components/AppointmentModal.tsx';
import { ActivityDrawer } from './components/ActivityDrawer.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { RosterModal } from './components/RosterModal.tsx';
import { Toast } from './components/Toast.tsx';
import { playSound } from './utils/audio.ts';
import { subscribeToQueue, executeQueueAction, INITIAL_STATE } from './services/queueService.ts';

const getCachedState = (): QueueState => {
  try {
    const raw = localStorage.getItem('queue_state_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.reps) && Array.isArray(parsed.presets)) {
        return parsed;
      }
    }
  } catch {
    // fallback to default
  }
  return INITIAL_STATE;
};

export default function App() {
  const [state, setState] = useState<QueueState>(getCachedState);
  const [connected, setConnected] = useState(false);
  const [activeDevices, setActiveDevices] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('queue_sound') !== 'false';
  });

  // Light ticker to update "on floor Xm" every 15 seconds without action triggers
  const [, setTick] = useState(0);
  useEffect(() => {
    const ticker = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(ticker);
  }, []);

  // Modal states
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2800);
  }, []);

  // Real-time Firestore subscription: updates immediately on any change across all devices
  useEffect(() => {
    const unsubscribe = subscribeToQueue(
      (newState) => {
        setState(newState);
        setConnected(true);
        try {
          localStorage.setItem('queue_state_cache', JSON.stringify(newState));
        } catch {
          // ignore
        }
      },
      (error) => {
        setConnected(false);
        showToast('Cloud sync error: ' + error.message, 'error');
      }
    );

    return () => unsubscribe();
  }, [showToast]);

  // Execute queue actions atomically via Firestore transaction
  const dispatchAction = useCallback(async (action: any) => {
    const res = await executeQueueAction(action);
    if (!res.success && res.message) {
      showToast(res.message, 'error');
    }
  }, [showToast]);

  // Audio feedback setting
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('queue_sound', String(nextVal));
    showToast(nextVal ? 'Sound feedback turned on' : 'Sound feedback muted');
  };

  // Handlers for Queue Actions
  const handleAssignWalkIn = () => {
    const available = state.reps.filter((r) => !r.checked);
    if (available.length === 0) {
      showToast('No names currently available', 'error');
      return;
    }
    const nextRep = available[0];
    if (soundEnabled) playSound('walkin');
    dispatchAction({ type: 'ASSIGN_WALKIN' });
    showToast(`${nextRep.name} checked`, 'success');
  };

  const handleAssignAppointment = (repId: string, note?: string) => {
    const rep = state.reps.find((r) => r.id === repId);
    if (!rep) return;
    if (soundEnabled) playSound('walkin');
    dispatchAction({ type: 'ASSIGN_APPOINTMENT', repId, note });
    showToast(`${rep.name} assigned`, 'success');
  };

  const handleToggle = (repId: string) => {
    const rep = state.reps.find((r) => r.id === repId);
    if (!rep) return;
    const willBeChecked = !rep.checked;
    if (soundEnabled) {
      playSound(willBeChecked ? 'check' : 'uncheck');
    }
    dispatchAction({ type: 'TOGGLE', repId });
    if (willBeChecked) {
      showToast(`${rep.name} checked`);
    } else {
      showToast(`${rep.name} returned to floor`);
    }
  };

  const handleAddRep = (name: string) => {
    if (soundEnabled) playSound('uncheck');
    dispatchAction({ type: 'ADD_REP', name, checked: false });
    showToast(`Added ${name}`);
  };

  const handleMove = (repId: string, direction: 'up' | 'down') => {
    dispatchAction({ type: 'MOVE_REP', repId, direction });
  };

  const handleRemove = (repId: string) => {
    const rep = state.reps.find((r) => r.id === repId);
    if (!rep) return;
    dispatchAction({ type: 'REMOVE_REP', repId });
    showToast(`Removed ${rep.name}`);
  };

  const handleSetStatus = (repId: string, status: RepItem['status']) => {
    dispatchAction({ type: 'SET_STATUS', repId, status });
  };

  const handleReset = (mode: 'daily_reset' | 'all_ready' | 'clear') => {
    dispatchAction({ type: 'RESET_QUEUE', mode });
    if (mode === 'daily_reset') showToast('Daily stats reset: Ups zeroed & floor times reset', 'success');
    else if (mode === 'all_ready') showToast('All set to available');
    else if (mode === 'clear') showToast('Board cleared');
  };

  const handleUndo = () => {
    if (soundEnabled) playSound('undo');
    dispatchAction({ type: 'UNDO' });
    showToast('Last action undone');
  };

  const handleUpdatePresets = (newPresets: string[]) => {
    dispatchAction({ type: 'UPDATE_PRESETS', presets: newPresets });
    showToast('Roster updated');
  };

  const availableReps = state.reps.filter((r) => !r.checked);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navigation Bar */}
      <Header
        connected={connected}
        activeDevices={activeDevices}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onUndo={handleUndo}
        onOpenShare={() => setIsShareOpen(true)}
        onToggleActivity={() => setIsActivityOpen(true)}
        activityCount={state.activity.length}
      />

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:px-6 sm:py-6 space-y-6">
        {/* Quick Add Bar & Presets */}
        <QuickClockIn
          presets={state.presets}
          activeReps={state.reps}
          onAddRep={handleAddRep}
          onEditPresets={() => setIsRosterOpen(true)}
          onReset={handleReset}
        />

        {/* Rep List */}
        <QueueList
          reps={state.reps}
          onToggle={handleToggle}
          onMove={handleMove}
          onRemove={handleRemove}
          onSetStatus={handleSetStatus}
        />
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Live Sync • Real-Time</span>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <button
              onClick={() => setIsShareOpen(true)}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Share / Link Device
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Slide-overs */}
      <AppointmentModal
        isOpen={isAppointmentOpen}
        availableReps={availableReps}
        onClose={() => setIsAppointmentOpen(false)}
        onAssign={handleAssignAppointment}
      />

      <ActivityDrawer
        isOpen={isActivityOpen}
        activity={state.activity}
        onClose={() => setIsActivityOpen(false)}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <RosterModal
        isOpen={isRosterOpen}
        presets={state.presets}
        onClose={() => setIsRosterOpen(false)}
        onUpdatePresets={handleUpdatePresets}
      />

      {/* Floating Feedback Toast */}
      <Toast message={toast?.message || null} type={toast?.type} />
    </div>
  );
}
