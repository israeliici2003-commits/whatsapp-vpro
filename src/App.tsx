import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, CircleDot, PhoneCall, Users, Settings,
  Wifi, Signal, Search, Lock
} from 'lucide-react';

import {
  Chat, Message, StatusItem, CallRecord, Contact, UserProfile, AppSettings, NetworkMode
} from './types';
import { translations } from './i18n';
import { currentUser, initialChats, initialMessages, initialStatuses, initialCalls, initialContacts } from './data/mockData';
import { encryptionService } from './services/encryptionService';

import { LockScreen } from './components/LockScreen';
import { AuthScreen } from './components/AuthScreen';
import { CallModal } from './components/CallModal';
import { StatusViewer } from './components/StatusViewer';
import { NewChatModal } from './components/NewChatModal';
import { SettingsScreen } from './components/SettingsScreen';
import { ChatDetail } from './components/ChatDetail';
import { AdvancedSearchModal } from './components/AdvancedSearchModal';
import { DataStorageScreen } from './components/DataStorageScreen';
import { QRCodeModal } from './components/QRCodeModal';

import { ChatsTab } from './components/Tabs/ChatsTab';
import { StatusTab } from './components/Tabs/StatusTab';
import { CallsTab } from './components/Tabs/CallsTab';
import { ContactsTab } from './components/Tabs/ContactsTab';
import { SettingsTab } from './components/Tabs/SettingsTab';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(currentUser);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    theme: 'dark',
    networkMode: 'internet',
    defaultSim: 'SIM 1',
    enterIsSend: true,
    mediaAutoDownload: true,
    soundEnabled: true,
    vibrationEnabled: true,
    securityLock: false,
    biometricLock: false,
    lastSeenPrivacy: 'everyone',
    profilePhotoPrivacy: 'everyone',
    statusPrivacy: 'everyone',
    wallpaper: 'doodles',
  });

  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [statuses, setStatuses] = useState<StatusItem[]>(initialStatuses);
  const [calls, setCalls] = useState<CallRecord[]>(initialCalls);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [cacheMb, setCacheMb] = useState<number>(142);

  const [activeTab, setActiveTab] = useState<'chats' | 'status' | 'calls' | 'contacts' | 'settings'>('chats');
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeCall, setActiveCall] = useState<{ name: string; avatar: string; type: 'voice' | 'video' } | null>(null);
  const [activeStatusIndex, setActiveStatusIndex] = useState<number | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showAdvancedSearchModal, setShowAdvancedSearchModal] = useState(false);
  const [showStorageScreen, setShowStorageScreen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [networkMode, setNetworkMode] = useState<NetworkMode>('internet');
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const replyTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const t = translations[settings.language];
  const resolvedTheme: 'light' | 'dark' =
    settings.theme === 'system'
      ? typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : settings.theme;

  useEffect(() => {
    encryptionService.initializeUser('user_me').catch((err) => {
      console.warn('Signal E2EE init warning:', err);
    });
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => {
      clearInterval(timer);
      replyTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const openChat = (chat: Chat) => {
    const clearedChat = { ...chat, unreadCount: 0 };
    setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c)));
    setActiveChat(clearedChat);
  };

  // Handle network toggle
  const toggleNetworkMode = () => {
    const nextMode: NetworkMode = networkMode === 'internet' ? 'sms' : 'internet';
    setNetworkMode(nextMode);
    setSettings((prev) => ({ ...prev, networkMode: nextMode }));
  };

  const handleSendMessage = async (
    text: string,
    type: Message['type'] = 'text',
    mediaUrl?: string,
    fileName?: string,
    duration?: number,
    replyTo?: Message['replyTo']
  ) => {
    if (!activeChat) return;
    const targetChatId = activeChat.id;
    const targetChatName = activeChat.name;
    const isGroupChat = activeChat.isGroup;

    let newMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId: targetChatId,
      senderId: 'user_me',
      text,
      timestamp: Date.now(),
      type,
      mediaUrl,
      fileName,
      fileSize: type === 'document' ? '1.8 MB' : undefined,
      duration,
      replyTo,
      status: 'delivered',
      sentVia: networkMode === 'sms' ? 'sms' : 'internet',
      simCard: networkMode === 'sms' ? settings.defaultSim : undefined,
    };

    if (networkMode === 'internet') {
      try {
        newMessage = await encryptionService.encryptAppMessage(newMessage, targetChatId);
      } catch (err) {
        console.warn('Message encryption skipped:', err);
      }
    }

    setMessages((prev) => ({
      ...prev,
      [targetChatId]: [...(prev[targetChatId] || []), newMessage],
    }));

    // Update unread count on chat
    setChats((prev) =>
      prev.map((c) => (c.id === targetChatId ? { ...c, unreadCount: 0 } : c))
    );

    // Simulated reply when in internet mode after 2.5 seconds with typing indicator
    if (networkMode === 'internet' && !isGroupChat) {
      setChats((prev) =>
        prev.map((c) => (c.id === targetChatId ? { ...c, onlineStatus: 'typing' } : c))
      );
      setActiveChat((prev) => (prev && prev.id === targetChatId ? { ...prev, onlineStatus: 'typing' } : prev));

      const timer = setTimeout(async () => {
        setChats((prev) =>
          prev.map((c) => (c.id === targetChatId ? { ...c, onlineStatus: 'online' } : c))
        );
        setActiveChat((prev) => (prev && prev.id === targetChatId ? { ...prev, onlineStatus: 'online' } : prev));

        let replyMsg: Message = {
          id: `reply_${Date.now()}`,
          chatId: targetChatId,
          senderId: targetChatId,
          senderName: targetChatName,
          text: `Got your message! Thanks for connecting on WhatsChat Pro. 👍`,
          timestamp: Date.now(),
          type: 'text',
          status: 'read',
          sentVia: 'internet',
        };

        try {
          const encryptedReply = await encryptionService.encryptAppMessage(replyMsg, targetChatId, {
            maskPlaintext: true,
          });
          replyMsg = await encryptionService.decryptAppMessage(encryptedReply, targetChatId);
        } catch (err) {
          console.warn('Reply E2EE round-trip warning:', err);
        }

        setMessages((p) => ({
          ...p,
          [targetChatId]: [...(p[targetChatId] || []), replyMsg],
        }));
      }, 2500);
      replyTimersRef.current.push(timer);
    }
  };

  const handleReactMessage = (messageId: string, emoji: string) => {
    if (!activeChat) return;
    const chatId = activeChat.id;
    setMessages((prev) => ({
      ...prev,
      [chatId]: (prev[chatId] || []).map((msg) => {
        if (msg.id !== messageId) return msg;
        const existingReactions = msg.reactions ? [...msg.reactions] : [];
        const idx = existingReactions.findIndex((r) => r.emoji === emoji);
        if (idx >= 0) {
          const current = existingReactions[idx];
          const hasMe = current.users.includes('user_me');
          const nextUsers = hasMe
            ? current.users.filter((u) => u !== 'user_me')
            : [...current.users, 'user_me'];
          if (nextUsers.length === 0) {
            existingReactions.splice(idx, 1);
          } else {
            existingReactions[idx] = { ...current, users: nextUsers };
          }
        } else {
          existingReactions.push({ emoji, users: ['user_me'] });
        }
        return { ...msg, reactions: existingReactions };
      }),
    }));
  };

  const handleClearActiveChat = () => {
    if (!activeChat) return;
    const chatId = activeChat.id;
    setMessages((prev) => ({ ...prev, [chatId]: [] }));
  };

  const handleToggleMuteActiveChat = () => {
    if (!activeChat) return;
    const chatId = activeChat.id;
    const nextMuted = !activeChat.isMuted;
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, isMuted: nextMuted } : c))
    );
    setActiveChat((prev) => (prev && prev.id === chatId ? { ...prev, isMuted: nextMuted } : prev));
  };

  const handleStartChatFromContact = (contact: Contact) => {
    let existing = chats.find((c) => c.name === contact.name);
    if (!existing) {
      const newChat: Chat = {
        id: `chat_${Date.now()}`,
        name: contact.name,
        avatar: contact.avatar,
        isGroup: false,
        unreadCount: 0,
        onlineStatus: 'online',
        about: contact.about,
        phone: contact.phone,
      };
      setChats((prev) => [newChat, ...prev]);
      existing = newChat;
    }
    openChat(existing);
    setShowNewChatModal(false);
    setActiveTab('chats');
  };

  const handleCreateGroup = (groupName: string, selectedIds: string[]) => {
    const newGroupChat: Chat = {
      id: `group_${Date.now()}`,
      name: groupName,
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=250',
      isGroup: true,
      participants: ['user_me', ...selectedIds],
      unreadCount: 0,
      adminIds: ['user_me'],
    };
    setChats((prev) => [newGroupChat, ...prev]);
    openChat(newGroupChat);
    setShowNewChatModal(false);
    setActiveTab('chats');
  };

  const handleCreateStatus = (
    content: string,
    type: 'text' | 'image',
    caption?: string,
    bgColor?: string,
    musicTitle?: string
  ) => {
    const newStatus: StatusItem = {
      id: `status_${Date.now()}`,
      userId: 'user_me',
      userName: userProfile.name,
      userAvatar: userProfile.avatar,
      type,
      content,
      caption,
      backgroundColor: bgColor,
      musicTitle,
      timestamp: Date.now(),
      expiresAt: Date.now() + 86400000,
      viewers: [],
      reactions: [],
    };
    setStatuses((prev) => [newStatus, ...prev]);
  };

  const handleEndCall = (duration: number) => {
    setActiveCall((currentCall) => {
      if (currentCall) {
        const newCallRecord: CallRecord = {
          id: `call_${Date.now()}`,
          callerName: currentCall.name,
          callerAvatar: currentCall.avatar,
          type: currentCall.type,
          direction: 'outgoing',
          timestamp: Date.now(),
          duration,
          simCard: networkMode === 'sms' ? settings.defaultSim : undefined,
        };
        setCalls((prev) => [newCallRecord, ...prev]);
      }
      return null;
    });
  };

  if (!isLoggedIn) {
    return (
      <AuthScreen
        language={settings.language}
        onLoginSuccess={(phone, name) => {
          setUserProfile((p) => ({ ...p, phone, name }));
          setIsLoggedIn(true);
        }}
      />
    );
  }

  if (isLocked) {
    return (
      <LockScreen
        language={settings.language}
        correctPin={settings.pinCode || '1234'}
        onUnlock={() => setIsLocked(false)}
      />
    );
  }

  const isOverlayScreenOpen = Boolean(activeChat || showSettingsScreen || showStorageScreen);

  return (
    <div className={`h-screen w-screen flex flex-col items-center justify-center ${resolvedTheme === 'light' ? 'bg-slate-200' : 'bg-slate-950'} font-sans antialiased overflow-hidden`}>
      {/* Phone Shell Container (Simulating Android Mobile Screen) */}
      <div className={`w-full h-full max-w-md sm:max-w-lg sm:h-[92vh] sm:rounded-3xl sm:shadow-2xl flex flex-col ${resolvedTheme === 'light' ? 'bg-[#efeae2] border-slate-300' : 'bg-[#111b21] border-slate-800'} overflow-hidden border relative`}>
        {/* Simulated Android Status Bar */}
        <div className="bg-[#202c33] px-4 py-1.5 flex justify-between items-center text-[11px] text-slate-300 font-mono select-none z-30">
          <span>{currentTime}</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400">
              {networkMode === 'sms' ? <Signal className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              {networkMode === 'sms' ? settings.defaultSim : '5G'}
            </span>
            <span className="font-bold">98% 🔋</span>
          </div>
        </div>

        {/* Top App Bar (When in Main Tabs) */}
        {!isOverlayScreenOpen && (
          <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between text-white shadow-md z-20">
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              {t.appTitle}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleNetworkMode}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition ${
                  networkMode === 'sms' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
                title="Toggle Internet vs SMS Mode"
              >
                {networkMode === 'sms' ? <Signal className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                <span>{networkMode === 'sms' ? 'SMS' : 'Net'}</span>
              </button>
              {settings.securityLock && (
                <button
                  onClick={() => setIsLocked(true)}
                  className="p-2 rounded-full hover:bg-slate-700/50 transition text-emerald-400 hover:text-emerald-300"
                  title="Lock App"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowAdvancedSearchModal(true)}
                className="p-2 rounded-full hover:bg-slate-700/50 transition text-slate-300 hover:text-white"
                title="Advanced Message Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettingsScreen(true)}
                className="p-2 rounded-full hover:bg-slate-700/50 transition"
                title={t.settings}
              >
                <Settings className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {activeChat ? (
            <ChatDetail
              chat={activeChat}
              messages={messages[activeChat.id] || []}
              onBack={() => setActiveChat(null)}
              onSendMessage={handleSendMessage}
              onStartCall={(type) => setActiveCall({ name: activeChat.name, avatar: activeChat.avatar, type })}
              networkMode={networkMode}
              onToggleNetworkMode={toggleNetworkMode}
              defaultSim={settings.defaultSim}
              language={settings.language}
              theme={resolvedTheme}
              onDeleteMessage={(id) => {
                setMessages((p) => ({
                  ...p,
                  [activeChat.id]: (p[activeChat.id] || []).filter((m) => m.id !== id),
                }));
              }}
              onStarMessage={(id) => {
                setMessages((p) => ({
                  ...p,
                  [activeChat.id]: (p[activeChat.id] || []).map((m) => (m.id === id ? { ...m, isStarred: !m.isStarred } : m)),
                }));
              }}
              onPinMessage={(id) => {
                setMessages((p) => ({
                  ...p,
                  [activeChat.id]: (p[activeChat.id] || []).map((m) =>
                    m.id === id ? { ...m, isPinned: !m.isPinned } : m
                  ),
                }));
              }}
              onReactMessage={handleReactMessage}
              onClearChat={handleClearActiveChat}
              onToggleMuteChat={handleToggleMuteActiveChat}
              onOpenSearch={() => setShowAdvancedSearchModal(true)}
              wallpaper={settings.wallpaper}
            />
          ) : showStorageScreen ? (
            <DataStorageScreen
              chats={chats}
              messages={messages}
              cacheMb={cacheMb}
              onBack={() => setShowStorageScreen(false)}
              onClearChatMedia={(chatId) => {
                setMessages((p) => ({
                  ...p,
                  [chatId]: (p[chatId] || []).filter((m) => m.type === 'text'),
                }));
              }}
              onClearAllCache={() => setCacheMb(0)}
              language={settings.language}
            />
          ) : showSettingsScreen ? (
            <SettingsScreen
              settings={settings}
              onUpdateSettings={(newS) => setSettings((p) => ({ ...p, ...newS }))}
              userProfile={userProfile}
              onUpdateProfile={(newP) => setUserProfile((p) => ({ ...p, ...newP }))}
              onOpenStorageScreen={() => setShowStorageScreen(true)}
              onOpenQrModal={() => setShowQrModal(true)}
              onLockApp={() => setIsLocked(true)}
              onBack={() => setShowSettingsScreen(false)}
            />
          ) : (
            <>
              {activeTab === 'chats' && (
                <ChatsTab
                  chats={chats}
                  messages={messages}
                  onSelectChat={openChat}
                  networkMode={networkMode}
                  defaultSim={settings.defaultSim}
                  language={settings.language}
                />
              )}
              {activeTab === 'status' && (
                <StatusTab
                  statuses={statuses}
                  userProfile={userProfile}
                  onOpenStatus={(idx) => setActiveStatusIndex(idx)}
                  onCreateStatus={handleCreateStatus}
                  language={settings.language}
                />
              )}
              {activeTab === 'calls' && (
                <CallsTab
                  calls={calls}
                  onStartCall={(name, avatar, type) => setActiveCall({ name, avatar, type })}
                  language={settings.language}
                />
              )}
              {activeTab === 'contacts' && (
                <ContactsTab
                  contacts={contacts}
                  onStartChat={handleStartChatFromContact}
                  onToggleBlock={(id) => {
                    setContacts((p) =>
                      p.map((c) => (c.id === id ? { ...c, isBlocked: !c.isBlocked } : c))
                    );
                  }}
                  language={settings.language}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsTab
                  settings={settings}
                  userProfile={userProfile}
                  onOpenSettingsScreen={() => setShowSettingsScreen(true)}
                  onLogout={() => setIsLoggedIn(false)}
                  language={settings.language}
                />
              )}
            </>
          )}

          {/* Floating Action Button (FAB) for New Chat / Broadcast */}
          {!isOverlayScreenOpen && activeTab === 'chats' && (
            <button
              onClick={() => setShowNewChatModal(true)}
              className="absolute bottom-6 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-950/60 transition transform hover:scale-105 active:scale-95 z-30"
              title="Start new conversation"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom Navigation Bar (WhatsApp 5 Tabs) */}
        {!isOverlayScreenOpen && (
          <div className="bg-[#202c33] border-t border-slate-700/50 px-2 py-2 flex items-center justify-around text-slate-400 z-20">
            {[
              { id: 'chats', label: t.chats, icon: MessageSquare },
              { id: 'status', label: t.status, icon: CircleDot },
              { id: 'calls', label: t.calls, icon: PhoneCall },
              { id: 'contacts', label: t.contacts, icon: Users },
              { id: 'settings', label: t.settings, icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'chats' | 'status' | 'calls' | 'contacts' | 'settings')}
                  className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                    isActive ? 'text-emerald-400 font-semibold bg-[#2a3942]' : 'hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Modals */}
        {showNewChatModal && (
          <NewChatModal
            contacts={contacts}
            onClose={() => setShowNewChatModal(false)}
            onStartChat={handleStartChatFromContact}
            onCreateGroup={handleCreateGroup}
            language={settings.language}
          />
        )}

        {activeCall && (
          <CallModal
            contactName={activeCall.name}
            contactAvatar={activeCall.avatar}
            callType={activeCall.type}
            onEndCall={handleEndCall}
            language={settings.language}
          />
        )}

        {activeStatusIndex !== null && (
          <StatusViewer
            statuses={statuses}
            initialIndex={activeStatusIndex}
            onClose={() => setActiveStatusIndex(null)}
            onReact={(id, emoji) => {
              setStatuses((p) =>
                p.map((s) => (s.id === id ? { ...s, reactions: [...s.reactions, { emoji, userId: 'user_me' }] } : s))
              );
            }}
            onReply={async (id, text) => {
              setActiveStatusIndex(null);
              const status = statuses.find((s) => s.id === id);
              if (status) {
                let targetChat = chats.find((c) => c.name === status.userName);
                if (!targetChat) {
                  targetChat = {
                    id: `chat_${Date.now()}`,
                    name: status.userName,
                    avatar: status.userAvatar,
                    isGroup: false,
                    unreadCount: 0,
                  };
                  setChats((prev) => [targetChat!, ...prev]);
                }
                let replyMsg: Message = {
                  id: `msg_${Date.now()}`,
                  chatId: targetChat.id,
                  senderId: 'user_me',
                  text,
                  timestamp: Date.now(),
                  type: 'text',
                  status: 'delivered',
                  sentVia: networkMode === 'sms' ? 'sms' : 'internet',
                  simCard: networkMode === 'sms' ? settings.defaultSim : undefined,
                  replyTo: {
                    id: status.id,
                    senderName: `${status.userName}'s Status`,
                    text: status.caption || (status.type === 'text' ? status.content : 'Photo status'),
                  },
                };
                if (networkMode === 'internet') {
                  try {
                    replyMsg = await encryptionService.encryptAppMessage(replyMsg, targetChat.id);
                  } catch (err) {
                    console.warn('Status reply encryption warning:', err);
                  }
                }
                setMessages((prev) => ({
                  ...prev,
                  [targetChat!.id]: [...(prev[targetChat!.id] || []), replyMsg],
                }));
                openChat(targetChat);
                setActiveTab('chats');
              }
            }}
            language={settings.language}
          />
        )}

        {showAdvancedSearchModal && (
          <AdvancedSearchModal
            chats={chats}
            messages={messages}
            currentChatId={activeChat?.id}
            onClose={() => setShowAdvancedSearchModal(false)}
            onSelectMessage={(chatId) => {
              const targetChat = chats.find((c) => c.id === chatId);
              if (targetChat) {
                openChat(targetChat);
                setActiveTab('chats');
              }
            }}
            language={settings.language}
          />
        )}

        {showQrModal && (
          <QRCodeModal
            userProfile={userProfile}
            onClose={() => setShowQrModal(false)}
            language={settings.language}
          />
        )}
      </div>
    </div>
  );
}
