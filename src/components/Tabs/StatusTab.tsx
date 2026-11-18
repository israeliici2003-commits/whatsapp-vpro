import React, { useState } from 'react';
import { Plus, Camera, Image as ImageIcon, Eye, Music } from 'lucide-react';
import { StatusItem, UserProfile } from '../../types';
import { translations, LanguageKey } from '../../i18n';

interface StatusTabProps {
  statuses: StatusItem[];
  userProfile: UserProfile;
  firebaseUserEmail?: string | null;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
  onOpenStatus: (index: number) => void;
  onCreateStatus: (content: string, type: 'text' | 'image', caption?: string, bgColor?: string, musicTitle?: string) => void;
  language: LanguageKey;
}

export const StatusTab: React.FC<StatusTabProps> = ({
  statuses,
  userProfile,
  firebaseUserEmail,
  onSignInGoogle,
  onSignOutGoogle,
  onOpenStatus,
  onCreateStatus,
  language
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contentType, setContentType] = useState<'text' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [bgColor, setBgColor] = useState('#005c4b');
  const [selectedMusic, setSelectedMusic] = useState('Afrobeat Vibes 2026 🎵');
  const t = translations[language];

  const samplePhotos = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800',
  ];

  const musicTracks = [
    'Afrobeat Vibes 2026 🎵',
    'Bongo Flava Hit 🎶',
    'Lo-Fi Chill Beat 🎧',
    'Amapiano Groove 🎷',
    'None'
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contentType === 'text' && !textContent.trim()) return;
    onCreateStatus(
      contentType === 'text' ? textContent.trim() : samplePhotos[selectedPhotoIndex],
      contentType,
      contentType === 'image' ? textContent.trim() || undefined : undefined,
      bgColor,
      selectedMusic !== 'None' ? selectedMusic : undefined
    );
    setTextContent('');
    setContentType('text');
    setShowCreateModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-white select-none overflow-y-auto p-4 space-y-6">
      {/* Firestore Cloud Sync Banner */}
      {(onSignInGoogle || firebaseUserEmail) && (
        <div className="bg-[#202c33] border border-slate-700/60 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs">
          {firebaseUserEmail ? (
            <>
              <span className="text-emerald-400 truncate">
                Cloud Synced: <span className="font-mono text-slate-200">{firebaseUserEmail}</span>
              </span>
              {onSignOutGoogle && (
                <button
                  onClick={onSignOutGoogle}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition"
                >
                  Disconnect
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-slate-300 truncate">Sign in with Google to sync statuses to Firestore</span>
              {onSignInGoogle && (
                <button
                  onClick={onSignInGoogle}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shrink-0 transition"
                >
                  Connect Google
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* My Status Card */}
      <div
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-4 bg-[#202c33] p-4 rounded-2xl cursor-pointer hover:bg-[#2a3942] transition shadow"
      >
        <div className="relative">
          <img
            src={userProfile.avatar}
            alt={userProfile.name}
            className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500"
          />
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#202c33]">
            <Plus className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-sm">{t.myStatus}</h3>
          <p className="text-xs text-slate-400">{t.tapToAddStatus}</p>
        </div>
      </div>

      {/* Recent Updates */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3">
          {t.recentUpdates}
        </h4>
        <div className="space-y-3">
          {statuses.map((status, index) => (
            <div
              key={status.id}
              onClick={() => onOpenStatus(index)}
              className="flex items-center gap-3 bg-[#202c33] p-3.5 rounded-2xl cursor-pointer hover:bg-[#2a3942] transition"
            >
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 to-teal-500">
                <img
                  src={status.userAvatar}
                  alt={status.userName}
                  className="w-full h-full rounded-full object-cover border-2 border-[#202c33]"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{status.userName}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400">
                    {new Date(status.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {status.musicTitle && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Music className="w-3 h-3" /> {status.musicTitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2.5">
                {status.reactions.length > 0 && (
                  <span className="bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full text-[11px]">
                    {status.reactions[status.reactions.length - 1].emoji} {status.reactions.length}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>{status.viewers.length}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Status Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-2xl p-6 text-white shadow-2xl relative flex flex-col justify-between"
            style={{ backgroundColor: bgColor, minHeight: '440px' }}
          >
            <div className="flex justify-between items-center gap-2">
              <h3 className="font-bold">Create Status Story</h3>
              <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setContentType('text')}
                  className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition ${
                    contentType === 'text' ? 'bg-white text-slate-900' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 hidden" />
                  <span>Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('image')}
                  className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition ${
                    contentType === 'image' ? 'bg-white text-slate-900' : 'text-white/80 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photo</span>
                </button>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition"
              >
                ✕
              </button>
            </div>

            <div className="my-auto py-4 space-y-3">
              {contentType === 'image' && (
                <div className="space-y-2">
                  <img
                    src={samplePhotos[selectedPhotoIndex]}
                    alt="Status preview"
                    className="w-full h-36 object-cover rounded-xl border border-white/20 shadow"
                  />
                  <div className="flex justify-center gap-2">
                    {samplePhotos.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition ${
                          selectedPhotoIndex === idx ? 'border-white scale-105' : 'border-transparent opacity-60'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={contentType === 'text' ? 'Type status text...' : 'Add optional photo caption...'}
                className={`w-full bg-transparent text-center placeholder-white/60 focus:outline-none resize-none ${
                  contentType === 'text' ? 'text-2xl font-bold' : 'text-sm font-medium bg-black/25 rounded-xl p-2'
                }`}
                rows={contentType === 'text' ? 3 : 2}
              />
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Music Selector */}
              <div className="flex items-center gap-2 bg-black/30 px-3 py-2 rounded-xl text-xs">
                <Music className="w-4 h-4 text-emerald-400 shrink-0" />
                <select
                  value={selectedMusic}
                  onChange={(e) => setSelectedMusic(e.target.value)}
                  className="bg-transparent text-white w-full focus:outline-none cursor-pointer"
                >
                  {musicTracks.map((track) => (
                    <option key={track} value={track} className="bg-slate-900 text-white">
                      {track}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-center gap-3">
                {['#005c4b', '#1f2c34', '#3b82f6', '#8b5cf6', '#ec4899'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setBgColor(col)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      bgColor === col ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={contentType === 'text' && !textContent.trim()}
                className="w-full bg-white text-slate-950 font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-100 disabled:opacity-50 transition"
              >
                Post Status (24h Expiry)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
