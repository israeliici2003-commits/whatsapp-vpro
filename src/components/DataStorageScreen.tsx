import React, { useState } from 'react';
import { ArrowLeft, Database, HardDrive, Trash2, Check } from 'lucide-react';
import { Chat, Message } from '../types';
import { LanguageKey } from '../i18n';

interface DataStorageScreenProps {
  chats: Chat[];
  messages: Record<string, Message[]>;
  cacheMb?: number;
  onBack: () => void;
  onClearChatMedia: (chatId: string) => void;
  onClearAllCache: () => void;
  language: LanguageKey;
}

export const DataStorageScreen: React.FC<DataStorageScreenProps> = ({
  chats,
  messages,
  cacheMb = 142,
  onBack,
  onClearChatMedia,
  onClearAllCache,
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmingChatId, setConfirmingChatId] = useState<string | null>(null);

  // Calculate storage per chat dynamically
  const chatStorageStats = chats
    .map((chat) => {
      const chatMsgs = messages[chat.id] || [];
      let mediaMb = 0;
      let docMb = 0;
      let audioMb = 0;

      chatMsgs.forEach((m) => {
        if (m.type === 'image' || m.type === 'video') mediaMb += 12;
        if (m.type === 'document') docMb += 5;
        if (m.type === 'audio') audioMb += 2;
      });

      const totalMb = mediaMb + docMb + audioMb + (chatMsgs.length > 0 ? 4 : 0);
      return { chat, totalMb, mediaMb, docMb, audioMb };
    })
    .sort((a, b) => b.totalMb - a.totalMb);

  const totalMediaMb = chatStorageStats.reduce((sum, s) => sum + s.mediaMb, 0);
  const totalDocsMb = chatStorageStats.reduce((sum, s) => sum + s.docMb, 0);
  const totalAudioMb = chatStorageStats.reduce((sum, s) => sum + s.audioMb, 0);
  const totalChatsMb = chatStorageStats.reduce((sum, s) => sum + s.totalMb, 0);
  const totalUsedMb = totalChatsMb + cacheMb;

  const barBase = Math.max(totalUsedMb, 1);
  const mediaPct = Math.round((totalMediaMb / barBase) * 100);
  const docsPct = Math.round((totalDocsMb / barBase) * 100);
  const audioPct = Math.round((totalAudioMb / barBase) * 100);

  const handleClearCache = () => {
    if (cacheMb === 0) return;
    const freed = cacheMb;
    onClearAllCache();
    setSuccessMessage(`Temporary cache cleared successfully! ${freed} MB freed.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleConfirmClearChat = (chatId: string, chatName: string) => {
    onClearChatMedia(chatId);
    setConfirmingChatId(null);
    setSuccessMessage(`Cleared media & files for ${chatName}`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white select-none">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Storage and Data</h1>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-3 text-center font-medium">
          {successMessage}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
        {/* Storage Usage Dashboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
              <HardDrive className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{totalUsedMb} MB Used</h3>
              <p className="text-xs text-slate-400">Out of 64 GB internal device storage</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex mb-4">
            <div className="bg-purple-500 h-full transition-all" style={{ width: `${mediaPct}%` }} title="Photos & Videos" />
            <div className="bg-blue-500 h-full transition-all" style={{ width: `${docsPct}%` }} title="Documents" />
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${audioPct}%` }} title="Voice Notes" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
              <span>Media ({totalMediaMb} MB)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              <span>Docs ({totalDocsMb} MB)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span>Audio ({totalAudioMb} MB)</span>
            </div>
          </div>
        </div>

        {/* Clear Cache Action */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Clear Temporary Cache</h4>
              <p className="text-xs text-slate-400">
                {cacheMb > 0 ? `Free up ${cacheMb} MB of cached thumbnails` : 'Cache is clean (0 MB)'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClearCache}
            disabled={cacheMb === 0}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs px-4 py-2.5 rounded-xl font-semibold transition flex items-center gap-1.5 shrink-0"
          >
            {cacheMb === 0 && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{cacheMb === 0 ? 'Cleared' : 'Clear Cache'}</span>
          </button>
        </div>

        {/* Per-Chat Storage Management */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Manage Storage Per Chat
          </h4>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {chatStorageStats.map(({ chat, totalMb }) => (
              <div key={chat.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <img src={chat.avatar} alt={chat.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
                  <div className="min-w-0">
                    <h5 className="font-semibold text-sm truncate">{chat.name}</h5>
                    <p className="text-xs text-slate-400">{totalMb} MB total media & files</p>
                  </div>
                </div>

                {confirmingChatId === chat.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleConfirmClearChat(chat.id, chat.name)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setConfirmingChatId(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingChatId(chat.id)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 transition shrink-0"
                    title="Clear media for this chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
