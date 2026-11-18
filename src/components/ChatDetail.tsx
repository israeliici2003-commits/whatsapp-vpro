import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Phone, Video, MoreVertical, Send, Mic, Paperclip,
  Check, CheckCheck, Wifi, Signal, Star, Pin, CornerUpLeft, Trash2,
  FileText, Image as ImageIcon, Download, Lock, Play, Pause, Search, BellOff, Eraser
} from 'lucide-react';
import { Chat, Message, NetworkMode } from '../types';
import { translations, LanguageKey } from '../i18n';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { EncryptionDetailsModal } from './EncryptionDetailsModal';

interface ChatDetailProps {
  chat: Chat;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (
    text: string,
    type?: Message['type'],
    mediaUrl?: string,
    fileName?: string,
    duration?: number,
    replyTo?: Message['replyTo']
  ) => void;
  onStartCall: (type: 'voice' | 'video') => void;
  networkMode: NetworkMode;
  onToggleNetworkMode: () => void;
  defaultSim?: 'SIM 1' | 'SIM 2';
  language: LanguageKey;
  theme?: 'light' | 'dark' | 'system';
  onDeleteMessage: (messageId: string) => void;
  onStarMessage: (messageId: string) => void;
  onPinMessage: (messageId: string) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onClearChat?: () => void;
  onToggleMuteChat?: () => void;
  onOpenSearch?: () => void;
  wallpaper?: string;
}

export const ChatDetail: React.FC<ChatDetailProps> = ({
  chat,
  messages,
  onBack,
  onSendMessage,
  onStartCall,
  networkMode,
  onToggleNetworkMode,
  defaultSim = 'SIM 1',
  language,
  theme = 'dark',
  onDeleteMessage,
  onStarMessage,
  onPinMessage,
  onReactMessage,
  onClearChat,
  onToggleMuteChat,
  onOpenSearch,
  wallpaper,
}) => {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const t = translations[language];
  const isLight = theme === 'light';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Stop playing audio when leaving chat
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const replyPayload = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.senderId === 'user_me' ? 'You' : replyingTo.senderName || chat.name,
          text: replyingTo.text,
        }
      : undefined;

    onSendMessage(inputText.trim(), 'text', undefined, undefined, undefined, replyPayload);
    setInputText('');
    setReplyingTo(null);
  };

  const handleSendMockImage = () => {
    setShowAttachMenu(false);
    onSendMessage(
      'Shared an image',
      'image',
      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800'
    );
  };

  const handleSendMockDocument = () => {
    setShowAttachMenu(false);
    onSendMessage(
      'Shared PDF Document',
      'document',
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'Financial_Report_2026.pdf'
    );
  };

  const togglePlayAudio = (msgId: string, audioUrl?: string) => {
    if (!audioUrl) return;
    if (playingAudioId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setPlayingAudioId(null);
      audio
        .play()
        .then(() => setPlayingAudioId(msgId))
        .catch(() => setPlayingAudioId(null));
    }
  };

  const pinnedMessage = messages.find((m) => m.isPinned);

  return (
    <div className={`flex flex-col h-full ${isLight ? 'bg-[#efeae2] text-slate-900' : 'bg-[#0b141a] text-white'} select-none relative overflow-hidden`}>
      {/* Top Chat Header */}
      <div className={`${isLight ? 'bg-emerald-700 text-white' : 'bg-[#202c33] text-white'} px-4 py-3 flex items-center justify-between border-b border-slate-700/50 z-20 shadow-md`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-black/20 text-slate-200 hover:text-white transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="relative cursor-pointer shrink-0">
            <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover" />
            {chat.onlineStatus === 'online' && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#202c33]" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm leading-tight truncate flex items-center gap-1.5">
              <span>{chat.name}</span>
              {chat.isMuted && <BellOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </h2>
            <p className={`text-[11px] truncate ${isLight ? 'text-emerald-100' : 'text-emerald-400'}`}>
              {chat.onlineStatus === 'typing'
                ? t.typing
                : chat.onlineStatus === 'online'
                ? t.online
                : chat.lastSeen || t.offline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 relative shrink-0">
          {/* Network Mode Indicator Button */}
          <button
            onClick={onToggleNetworkMode}
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition ${
              networkMode === 'sms'
                ? 'bg-amber-600/30 text-amber-200 border border-amber-400/40'
                : 'bg-emerald-600/30 text-emerald-200 border border-emerald-400/40'
            }`}
            title="Click to toggle Internet vs SMS mode"
          >
            {networkMode === 'sms' ? <Signal className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {networkMode === 'sms' ? `SMS (${defaultSim})` : 'Internet'}
            </span>
          </button>

          <button
            onClick={() => onStartCall('voice')}
            className="p-2.5 rounded-full hover:bg-black/20 text-slate-200 hover:text-white transition"
            title={t.callVoice}
          >
            <Phone className="w-5 h-5" />
          </button>

          <button
            onClick={() => onStartCall('video')}
            className="p-2.5 rounded-full hover:bg-black/20 text-slate-200 hover:text-white transition"
            title={t.callVideo}
          >
            <Video className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowMoreMenu((prev) => !prev)}
            className="p-2.5 rounded-full hover:bg-black/20 text-slate-200 hover:text-white transition"
            title="Chat options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-12 w-52 bg-[#233138] text-white border border-slate-700 rounded-2xl shadow-2xl py-2 z-30 text-xs">
              {onOpenSearch && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenSearch();
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                >
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Search messages</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowEncryptionModal(true);
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-700/60 flex items-center gap-2.5 transition"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Encryption & safety code</span>
              </button>
              {onToggleMuteChat && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onToggleMuteChat();
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-700/60 flex items-center gap-2.5 transition"
                >
                  <BellOff className="w-4 h-4 text-amber-400" />
                  <span>{chat.isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
                </button>
              )}
              {onClearChat && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onClearChat();
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-rose-600/20 text-rose-300 flex items-center gap-2.5 transition"
                >
                  <Eraser className="w-4 h-4" />
                  <span>{t.clearChat}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Security Banner (Clickable to view E2EE details) */}
      <div
        onClick={() => setShowEncryptionModal(true)}
        className={`${isLight ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100' : 'bg-[#182229] text-amber-200/90 border-slate-800 hover:bg-[#202c33]'} cursor-pointer px-4 py-2 text-center text-[11px] border-b flex items-center justify-center gap-1.5 z-10 transition`}
        title="Click to view Signal Protocol E2EE details & safety number"
      >
        <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Messages are end-to-end encrypted. Tap to verify safety number.</span>
      </div>

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div className={`${isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#202c33] text-white border-slate-700/50'} border-b px-4 py-2 flex items-center justify-between text-xs z-10 shadow`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <Pin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-emerald-500 block text-[10px] uppercase">Pinned Message</span>
              <p className="truncate">{pinnedMessage.text}</p>
            </div>
          </div>
          <button
            onClick={() => onPinMessage(pinnedMessage.id)}
            className="text-slate-400 hover:text-emerald-500 text-xs px-2 py-1 font-bold shrink-0"
            title="Unpin"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-3 bg-[size:16px_16px] ${
          wallpaper === 'forest'
            ? 'bg-[#0a261c] bg-[radial-gradient(#144533_1px,transparent_1px)]'
            : wallpaper === 'ocean'
            ? 'bg-[#0b192c] bg-[radial-gradient(#1e3e62_1px,transparent_1px)]'
            : wallpaper === 'midnight'
            ? 'bg-[#050505] bg-[radial-gradient(#1a1a1a_1px,transparent_1px)]'
            : isLight
            ? 'bg-[#efeae2] bg-[radial-gradient(#d8d2c7_1px,transparent_1px)]'
            : 'bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)]'
        }`}
      >
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No messages yet. Say hello!
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === 'user_me';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] sm:max-w-md rounded-2xl px-4 py-2.5 relative group shadow-sm ${
                  isMe
                    ? msg.sentVia === 'sms'
                      ? 'bg-[#1e3a2f] text-white border border-amber-500/30'
                      : isLight
                      ? 'bg-[#d9fdd3] text-slate-900'
                      : 'bg-[#005c4b] text-white'
                    : isLight
                    ? 'bg-white text-slate-900'
                    : 'bg-[#202c33] text-white'
                }`}
              >
                {!isMe && chat.isGroup && msg.senderName && (
                  <p className="text-[11px] font-semibold text-emerald-400 mb-1">{msg.senderName}</p>
                )}

                {/* Quoted Reply Block */}
                {msg.replyTo && (
                  <div className={`mb-2 px-3 py-1.5 rounded-xl border-l-4 border-emerald-400 text-xs ${isLight ? 'bg-black/5' : 'bg-black/25'}`}>
                    <span className="font-semibold text-emerald-400 block text-[11px]">
                      {msg.replyTo.senderName}
                    </span>
                    <p className="opacity-80 truncate">{msg.replyTo.text}</p>
                  </div>
                )}

                {/* Media rendering */}
                {msg.type === 'image' && msg.mediaUrl && (
                  <img src={msg.mediaUrl} alt="Media" className="rounded-xl mb-2 max-h-60 w-full object-cover" />
                )}

                {msg.type === 'document' && (
                  <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl mb-2">
                    <FileText className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{msg.fileName}</p>
                      <p className="text-[10px] opacity-75">{msg.fileSize}</p>
                    </div>
                    <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-full transition">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {msg.type === 'audio' && (
                  <div className="flex items-center gap-3 bg-black/20 px-3 py-2.5 rounded-xl mb-1 min-w-[220px]">
                    <button
                      onClick={() => togglePlayAudio(msg.id, msg.mediaUrl)}
                      className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition shadow"
                    >
                      {playingAudioId === msg.id ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                        <div className={`h-full bg-emerald-400 ${playingAudioId === msg.id ? 'w-full transition-all duration-1000' : 'w-1/3'}`} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] opacity-80 mt-1">
                        <span>Voice Note</span>
                        <span className="font-mono">0:{msg.duration && msg.duration < 10 ? `0${msg.duration}` : msg.duration || '05'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {msg.type !== 'audio' && (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                )}

                {/* Reaction Pills */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {msg.reactions.map((r) => (
                      <button
                        key={r.emoji}
                        onClick={() => onReactMessage(msg.id, r.emoji)}
                        className="px-1.5 py-0.5 rounded-full bg-black/25 text-[11px] flex items-center gap-1 hover:bg-black/40 transition"
                      >
                        <span>{r.emoji}</span>
                        {r.users.length > 1 && <span className="text-[10px]">{r.users.length}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer Info (Time, Ticks, SIM / SMS Badge, E2EE) */}
                <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] opacity-75">
                  {msg.isEncrypted && (
                    <span title={`Encrypted (${msg.encryptionProtocol || 'Signal-X3DH-AES256GCM'})`}>
                      <Lock className="w-3 h-3 text-emerald-400" />
                    </span>
                  )}
                  {msg.sentVia === 'sms' && (
                    <span className="bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase">
                      SMS ({msg.simCard || 'SIM 1'})
                    </span>
                  )}
                  {msg.isPinned && <Pin className="w-3 h-3 text-emerald-400" />}
                  {msg.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && (
                    <span className={msg.status === 'read' ? 'text-cyan-400' : ''}>
                      {msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    </span>
                  )}
                </div>

                {/* Quick Hover Actions Menu */}
                <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-[#111b21]/95 text-white backdrop-blur-sm rounded-lg p-1 shadow-lg border border-slate-700/60 z-10">
                  {['👍', '❤️', '😂'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReactMessage(msg.id, emoji)}
                      className="px-1 text-xs hover:scale-125 transition"
                      title={`React ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={() => onPinMessage(msg.id)}
                    className={`p-1 transition ${msg.isPinned ? 'text-emerald-400' : 'hover:text-emerald-400'}`}
                    title={msg.isPinned ? t.unpin : t.pin}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onStarMessage(msg.id)}
                    className={`p-1 transition ${msg.isStarred ? 'text-amber-400' : 'hover:text-amber-400'}`}
                    title={msg.isStarred ? t.unstar : t.star}
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setReplyingTo(msg)} className="p-1 hover:text-emerald-400 transition" title={t.reply}>
                    <CornerUpLeft className="w-3.5 h-3.5" />
                  </button>
                  {isMe && (
                    <button onClick={() => onDeleteMessage(msg.id)} className="p-1 hover:text-rose-400 transition" title={t.delete}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Replying Banner */}
      {replyingTo && (
        <div className={`${isLight ? 'bg-white text-slate-900' : 'bg-[#202c33] text-white'} px-4 py-2 border-l-4 border-emerald-500 flex items-center justify-between text-xs`}>
          <div className="min-w-0">
            <span className="font-semibold text-emerald-500 block">
              Replying to {replyingTo.senderId === 'user_me' ? 'You' : chat.name}
            </span>
            <p className="opacity-75 truncate max-w-md">{replyingTo.text}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="opacity-70 hover:opacity-100 font-bold px-2">✕</button>
        </div>
      )}

      {/* Input Bar */}
      <div className={`${isLight ? 'bg-[#f0f2f5] border-slate-200' : 'bg-[#202c33] border-slate-700/50'} p-3 flex items-center gap-2 relative z-20 border-t`}>
        {isRecording ? (
          <VoiceNoteRecorder
            onSendVoiceNote={(audioUrl, duration) => {
              setIsRecording(false);
              onSendMessage('Voice Note', 'audio', audioUrl, 'Voice_Note.webm', duration);
            }}
            onCancel={() => setIsRecording(false)}
            language={language}
          />
        ) : (
          <>
            <div className="relative">
              <button
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`p-2.5 rounded-full transition ${isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-700 text-slate-300 hover:text-white'}`}
                title="Attach"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Attachment Popover */}
              {showAttachMenu && (
                <div className="absolute bottom-14 left-0 bg-[#233138] text-white border border-slate-700 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 w-48 z-30">
                  <button onClick={handleSendMockImage} className="flex items-center gap-3 p-2.5 hover:bg-slate-700/60 rounded-xl text-xs font-medium transition">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <span>Photos & Videos</span>
                  </button>
                  <button onClick={handleSendMockDocument} className="flex items-center gap-3 p-2.5 hover:bg-slate-700/60 rounded-xl text-xs font-medium transition">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>Document PDF</span>
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={networkMode === 'sms' ? `Type SMS (${defaultSim})...` : t.typeMessage}
                className={`flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition ${
                  isLight ? 'bg-white text-slate-900 placeholder-slate-400' : 'bg-[#2a3942] text-white placeholder-slate-400'
                }`}
              />
            </form>

            {inputText.trim() ? (
              <button
                onClick={handleSend}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition"
              >
                <Send className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsRecording(true)}
                className={`p-3 rounded-full transition ${isLight ? 'bg-white text-emerald-600 hover:bg-slate-100' : 'bg-[#2a3942] hover:bg-slate-700 text-emerald-400'}`}
                title={t.voiceNote}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Encryption Details Modal */}
      {showEncryptionModal && (
        <EncryptionDetailsModal
          chatId={chat.id}
          contactName={chat.name}
          contactPhone={chat.phone || '+254 700 000 000'}
          onClose={() => setShowEncryptionModal(false)}
          language={language}
        />
      )}
    </div>
  );
};
