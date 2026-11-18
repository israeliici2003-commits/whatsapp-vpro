import React from 'react';
import { PhoneCall, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Signal } from 'lucide-react';
import { CallRecord } from '../../types';
import { translations, LanguageKey } from '../../i18n';

interface CallsTabProps {
  calls: CallRecord[];
  onStartCall: (name: string, avatar: string, type: 'voice' | 'video') => void;
  language: LanguageKey;
}

export const CallsTab: React.FC<CallsTabProps> = ({ calls, onStartCall, language }) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-white select-none overflow-y-auto p-4 space-y-4">
      <div className="space-y-3">
        {calls.map((call) => (
          <div
            key={call.id}
            className="flex items-center justify-between bg-[#202c33] p-3.5 rounded-2xl hover:bg-[#2a3942] transition"
          >
            <div className="flex items-center gap-3">
              <img
                src={call.callerAvatar}
                alt={call.callerName}
                className="w-13 h-13 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-sm mb-1">{call.callerName}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  {call.direction === 'incoming' && <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />}
                  {call.direction === 'outgoing' && <PhoneOutgoing className="w-3.5 h-3.5 text-blue-400" />}
                  {call.direction === 'missed' && <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />}
                  <span>
                    {new Date(call.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                    {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {call.simCard && (
                    <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[9px] font-mono">
                      {call.simCard}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onStartCall(call.callerName, call.callerAvatar, call.type)}
                className="p-3 rounded-full bg-[#2a3942] hover:bg-emerald-600 text-emerald-400 hover:text-white transition shadow"
              >
                {call.type === 'video' ? <Video className="w-5 h-5" /> : <PhoneCall className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
