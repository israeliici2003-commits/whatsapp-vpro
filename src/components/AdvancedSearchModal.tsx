import React, { useState, useMemo } from 'react';
import { Search, X, Calendar, Star, FileText, Image as ImageIcon, Mic, Filter, MessageSquare, ArrowRight } from 'lucide-react';
import { Message, Chat } from '../types';
import { translations, LanguageKey } from '../i18n';

interface AdvancedSearchModalProps {
  chats: Chat[];
  messages: Record<string, Message[]>;
  currentChatId?: string;
  onClose: () => void;
  onSelectMessage: (chatId: string, messageId: string) => void;
  language: LanguageKey;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  chats,
  messages,
  currentChatId,
  onClose,
  onSelectMessage,
  language
}) => {
  const [query, setQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string>(currentChatId || 'all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>('all');
  const [starredOnly, setStarredOnly] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const t = translations[language];

  // Flatten and index messages for lightning-fast search
  const allIndexedMessages = useMemo(() => {
    const list: { chat: Chat; message: Message }[] = [];
    Object.entries(messages).forEach(([chatId, msgList]) => {
      const chat = chats.find((c) => c.id === chatId);
      if (chat) {
        msgList.forEach((msg) => {
          list.push({ chat, message: msg });
        });
      }
    });
    return list;
  }, [chats, messages]);

  // Filtered results with indexing & multi-criteria filters
  const searchResults = useMemo(() => {
    const now = Date.now();
    const oneDay = 86400000;
    const oneWeek = oneDay * 7;
    const oneMonth = oneDay * 30;

    return allIndexedMessages.filter(({ chat, message }) => {
      // Chat filter
      if (selectedChatId !== 'all' && chat.id !== selectedChatId) return false;

      // Keyword query match
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesText = message.text.toLowerCase().includes(q);
        const matchesSender = message.senderName?.toLowerCase().includes(q) || chat.name.toLowerCase().includes(q);
        const matchesFile = message.fileName?.toLowerCase().includes(q);
        if (!matchesText && !matchesSender && !matchesFile) return false;
      }

      // Media type filter
      if (mediaTypeFilter !== 'all') {
        if (mediaTypeFilter === 'text' && message.type !== 'text') return false;
        if (mediaTypeFilter === 'image' && message.type !== 'image') return false;
        if (mediaTypeFilter === 'document' && message.type !== 'document') return false;
        if (mediaTypeFilter === 'audio' && message.type !== 'audio') return false;
      }

      // Starred filter
      if (starredOnly && !message.isStarred) return false;

      // Date range filter
      if (dateRange === 'today' && now - message.timestamp > oneDay) return false;
      if (dateRange === 'week' && now - message.timestamp > oneWeek) return false;
      if (dateRange === 'month' && now - message.timestamp > oneMonth) return false;

      return true;
    }).sort((a, b) => b.message.timestamp - a.message.timestamp);
  }, [allIndexedMessages, query, selectedChatId, mediaTypeFilter, starredOnly, dateRange]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-white shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg">Advanced Message Search</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/20">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keywords, filenames, senders..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-inner"
              autoFocus
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {/* Chat Selector */}
            <select
              value={selectedChatId}
              onChange={(e) => setSelectedChatId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">🌐 All Chats</option>
              {chats.map((c) => (
                <option key={c.id} value={c.id}>💬 {c.name}</option>
              ))}
            </select>

            {/* Media Type Filter */}
            <select
              value={mediaTypeFilter}
              onChange={(e) => setMediaTypeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">📁 All Media Types</option>
              <option value="text">📝 Text Only</option>
              <option value="image">🖼️ Images</option>
              <option value="document">📄 Documents</option>
              <option value="audio">🎤 Voice Notes</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">📅 Any Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>

            {/* Starred Toggle */}
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition font-medium ${
                starredOnly ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Starred</span>
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span>Found {searchResults.length} matching messages</span>
            <span className="font-mono">Indexed Search</span>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No messages found matching your criteria</p>
              <p className="text-xs text-slate-600 mt-1">Try adjusting your filters or keywords</p>
            </div>
          ) : (
            searchResults.map(({ chat, message }) => (
              <div
                key={message.id}
                onClick={() => {
                  onSelectMessage(chat.id, message.id);
                  onClose();
                }}
                className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/40 p-3.5 rounded-2xl cursor-pointer transition flex items-center justify-between group shadow"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                  <img src={chat.avatar} alt={chat.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs text-emerald-400">{chat.name}</span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(message.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 ml-1" />}
                    </div>
                    <p className="text-sm text-white truncate font-normal">{message.text}</p>
                    {message.fileName && (
                      <p className="text-xs text-emerald-300 font-mono mt-0.5 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {message.fileName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-emerald-600 text-slate-300 group-hover:text-white flex items-center justify-center transition shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
