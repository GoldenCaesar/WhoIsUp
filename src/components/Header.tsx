import React from 'react';
import { Wifi, WifiOff, Volume2, VolumeX, RotateCcw, QrCode, History } from 'lucide-react';

interface HeaderProps {
  connected: boolean;
  activeDevices: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onUndo: () => void;
  onOpenShare: () => void;
  onToggleActivity: () => void;
  activityCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  activeDevices,
  soundEnabled,
  onToggleSound,
  onUndo,
  onOpenShare,
  onToggleActivity,
  activityCount,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Live Indicator */}
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <h1 className="inline-flex items-center space-x-1.5 text-base sm:text-lg font-bold text-slate-100 tracking-tight whitespace-nowrap">
                <span>Who Is</span>
                <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 inline-flex items-center justify-center text-emerald-400 font-extrabold text-xs tracking-wider shadow-sm flex-shrink-0">
                  UP
                </span>
                <span>?</span>
              </h1>
              {/* Connection Pill */}
              <div
                className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                  connected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                }`}
              >
                {connected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live • Synced</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    <span>Connecting...</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute sound feedback' : 'Enable sound feedback'}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
              soundEnabled
                ? 'text-slate-300 border-slate-700/60 hover:bg-slate-800/80 hover:text-white'
                : 'text-slate-500 border-slate-800 bg-slate-900 hover:text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onUndo}
            title="Undo last action"
            className="p-2 rounded-lg text-xs font-medium border border-slate-700/60 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenShare}
            title="Share queue link / QR code"
            className="p-2 rounded-lg text-xs font-medium border border-slate-700/60 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors flex items-center space-x-1"
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden md:inline text-xs">Share</span>
          </button>

          <button
            onClick={onToggleActivity}
            title="Activity log"
            className="p-2 rounded-lg text-xs font-medium border border-slate-700/60 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors relative"
          >
            <History className="w-4 h-4" />
            {activityCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950 flex items-center justify-center">
                {activityCount > 9 ? '9+' : activityCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
