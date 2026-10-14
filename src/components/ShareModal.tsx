import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Smartphone } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=0f172a&color=34d399&margin=10`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm shadow-2xl p-5 text-center">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-left">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Device Link</h3>
              <p className="text-[11px] text-slate-400">Sync with another phone, tablet, or PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code */}
        <div className="my-5 flex flex-col items-center">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
            <img
              src={qrApiUrl}
              alt="Scan QR code"
              className="w-44 h-44 rounded-xl object-contain"
              loading="lazy"
            />
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scan with camera to open</span>
          </p>
        </div>

        {/* Copy Link Input */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3 text-xs">
          <span className="text-slate-400 truncate flex-1 font-mono text-[11px]">
            {currentUrl}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
