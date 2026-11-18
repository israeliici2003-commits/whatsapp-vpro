import React, { useState } from 'react';
import { Search, Pin, BellOff, Wifi, Signal } from 'lucide-react';
import { Chat, Message, NetworkMode } from '../../types';
import { translations, LanguageKey } from '../../i18n';

interface ChatsTabProps {
  chats: Chat[];
  messages: Record<string, Message[]>;
  onSelectChat: (chat: Chat) => void;
  networkMode: NetworkMode;
  defaultSim?: 'SIM 1' | 'SIM 2';
  language: LanguageKey;
}

export const ChatsTab: React.FC<ChatsTabProps> = ({
  chats,
  messages,
  onSelectChat,
  networkMode,
  defaultSim = 'SIM 1',
  language
}) => {
  const [search, setSearch] = useState('');
  const t = translations[language];

  const filteredChats = [...chats]
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-white select-none">
      {/* Search Header */}
      <div className="p-3 bg-[#111b21] border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchChats}
            className="w-full bg-[#202c33] border border-transparent focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Network Status Banner */}
      <div className="px-4 py-2 bg-[#202c33]/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {networkMode === 'sms' ? (
            <Signal className="w-4 h-4 text-amber-400" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-slate-300">
            {networkMode === 'sms' ? `SMS Mode active (${defaultSim})` : t.internetMode}
          </span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {filteredChats.length === 0 && (
          <div className="text-center py-12 text-xs text-slate-400">
            No matching conversations
          </div>
        )}
        {filteredChats.map((chat) => {
          const chatMsgs = messages[chat.id] || [];
          const lastMsg = chatMsgs[chatMsgs.length - 1];

          return (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#202c33]/60 cursor-pointer transition relative group"
            >
              <div className="relative shrink-0">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-13 h-13 rounded-full object-cover"
                />
                {chat.onlineStatus === 'online' && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#111b21]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 truncate pr-2">
                    {chat.onlineStatus === 'typing' ? (
                      <span className="text-emerald-400 font-medium">{t.typing}</span>
                    ) : lastMsg ? (
                      lastMsg.text
                    ) : (
                      chat.about || 'Start conversation...'
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {chat.isMuted && <BellOff className="w-3.5 h-3.5 text-slate-400" />}
                    {chat.isPinned && <Pin className="w-3.5 h-3.5 text-emerald-400" />}
                    {chat.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
