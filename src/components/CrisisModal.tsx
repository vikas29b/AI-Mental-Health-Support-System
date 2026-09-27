import React from 'react';
import { 
  PhoneCall, 
  MessageSquare, 
  ExternalLink, 
  X, 
  ShieldAlert, 
  Heart, 
  CheckCircle2 
} from 'lucide-react';
import { CrisisResource } from '../../server/types.js';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: CrisisResource[];
  sessionId?: string;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({
  isOpen,
  onClose,
  resources,
  sessionId,
}) => {
  if (!isOpen) return null;

  const handleActionClick = async (res: CrisisResource) => {
    // Asynchronously log action to backend warehouse
    try {
      await fetch('/api/analytics/emergency-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId || 'sess_modal',
          action: res.contact_type === 'phone' ? 'call_clicked' : 'text_clicked',
        }),
      });
    } catch {
      // non-blocking
    }

    if (res.contact_type === 'phone') {
      const cleanNum = res.contact_value.replace(/[^0-9]/g, '');
      window.open(`tel:${cleanNum || '988'}`, '_self');
    } else if (res.contact_type === 'text') {
      window.open(`sms:741741`, '_self');
    } else if (res.contact_type === 'web') {
      window.open(res.contact_value, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-rose-500/50 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-100 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">
                  Crisis Support & Immediate Help
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  CONFIDENTIAL 24/7
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                You do not have to carry this alone. Free, compassionate support is available right now.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Notice Banner */}
        <div className="my-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-3 text-xs text-rose-200">
          <Heart className="w-5 h-5 text-rose-400 shrink-0" />
          <span>
            If you or someone around you is in immediate physical danger, please call emergency services (<strong>911</strong> in the US/Canada, <strong>112</strong> in Europe) or go to the nearest emergency room.
          </span>
        </div>

        {/* Resources Grid */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {resources.map((res) => {
            const isPrimary = res.primary;
            return (
              <div
                key={res.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isPrimary
                    ? 'bg-slate-800/90 border-rose-500/40 shadow-sm'
                    : 'bg-slate-800/50 border-slate-700/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white">{res.name}</h4>
                    {isPrimary && (
                      <span className="flex items-center text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Verified 24/7
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {res.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Region: <strong className="text-slate-200">{res.region}</strong></span>
                    <span>•</span>
                    <span>Hours: <strong className="text-slate-200">{res.availability}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleActionClick(res)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm w-full sm:w-auto ${
                      isPrimary
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {res.contact_type === 'phone' && <PhoneCall className="w-4 h-4" />}
                    {res.contact_type === 'text' && <MessageSquare className="w-4 h-4" />}
                    {res.contact_type === 'web' && <ExternalLink className="w-4 h-4" />}
                    <span>{res.action_label}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>All crisis calls and texts are 100% confidential.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            I am Safe / Close
          </button>
        </div>
      </div>
    </div>
  );
};
