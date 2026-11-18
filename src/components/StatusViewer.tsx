import React, { useState, useEffect } from 'react';
import { X, Heart, Send, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusItem } from '../types';
import { translations, LanguageKey } from '../i18n';

interface StatusViewerProps {
  statuses: StatusItem[];
  initialIndex?: number;
  onClose: () => void;
  onReact: (statusId: string, emoji: string) => void;
  onReply: (statusId: string, text: string) => void;
  language: LanguageKey;
}

export const StatusViewer: React.FC<StatusViewerProps> = ({
  statuses,
  initialIndex = 0,
  onClose,
  onReact,
  onReply,
  language
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [showViewers, setShowViewers] = useState(false);
  const t = translations[language];

  const currentStatus = statuses[currentIndex];

  useEffect(() => {
    setProgress(0);
    if (!currentStatus) return;

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentIndex, statuses.length, onClose]);

  if (!currentStatus) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(currentStatus.id, replyText);
    setReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between text-white select-none">
      {/* Top Progress Bars */}
      <div className="absolute top-2 left-2 right-2 z-20 flex gap-1.5">
        {statuses.map((s, idx) => (
          <div key={s.id} className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width:
                  idx < currentIndex
                    ? '100%'
                    : idx === currentIndex
                    ? `${progress}%`
                    : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={currentStatus.userAvatar}
            alt={currentStatus.userName}
            className="w-10 h-10 rounded-full object-cover border border-white/40"
          />
          <div>
            <h4 className="font-semibold text-sm drop-shadow">{currentStatus.userName}</h4>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-slate-300 drop-shadow">
                {new Date(currentStatus.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              {currentStatus.musicTitle && (
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  🎵 {currentStatus.musicTitle}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content Area */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: currentStatus.backgroundColor || '#111b21'
        }}
      >
        {currentStatus.type === 'image' ? (
          <img
            src={currentStatus.content}
            alt="Status"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="p-8 text-center text-2xl font-bold max-w-lg leading-relaxed">
            {currentStatus.content}
          </div>
        )}

        {currentStatus.caption && (
          <div className="absolute bottom-20 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl text-center text-sm font-medium">
            {currentStatus.caption}
          </div>
        )}
      </div>

      {/* Viewers & Reactions Toggle */}
      <div className="absolute bottom-16 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setShowViewers(!showViewers)}
          className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 hover:bg-black/70 transition"
        >
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>{currentStatus.viewers.length} views</span>
        </button>
      </div>

      {/* Bottom Reply Bar */}
      <form onSubmit={handleSendReply} className="p-4 bg-black/80 backdrop-blur-md flex items-center gap-3 z-20">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={`Reply to ${currentStatus.userName}...`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
        />
        <div className="flex items-center gap-2">
          {['❤️', '🔥', '👏', '😂'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(currentStatus.id, emoji)}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-lg transition transform hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={!replyText.trim()}
          className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-full transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Viewers Modal Popup */}
      {showViewers && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-30 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <span>Status Viewers</span>
              </h3>
              <button onClick={() => setShowViewers(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {currentStatus.viewers.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No viewers yet.</p>
              ) : (
                currentStatus.viewers.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-xl">
                    <span className="text-sm font-medium">{v.userName}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
