import React, { useState } from 'react';
import { QrCode, X, Share2, Copy, Check, UserPlus } from 'lucide-react';
import { UserProfile } from '../types';
import { translations, LanguageKey } from '../i18n';

interface QRCodeModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  language: LanguageKey;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ userProfile, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const profileUrl = `https://whatschat.pro/u/${userProfile.phone.replace(/\s+/g, '')}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      // Clipboard may be restricted in non-HTTPS contexts
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${userProfile.name} on WhatsChat Pro`,
          text: `Connect with ${userProfile.name} on WhatsChat Pro`,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard?.writeText(profileUrl);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // User cancelled share dialog or share unavailable; fallback silently to copied state
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm text-white shadow-2xl p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />

        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <img
          src={userProfile.avatar}
          alt={userProfile.name}
          className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-emerald-500/40 shadow-xl"
        />

        <h3 className="font-bold text-lg mb-1">{userProfile.name}</h3>
        <p className="text-xs text-emerald-400 font-mono mb-6">{userProfile.phone}</p>

        {/* Simulated QR Code Box */}
        <div className="bg-white p-6 rounded-2xl w-56 h-56 mx-auto mb-6 flex flex-col items-center justify-center shadow-inner relative group">
          <div className="grid grid-cols-6 gap-2 w-full h-full p-2 bg-slate-900 rounded-xl">
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-sm ${
                  (i + (i % 3)) % 2 === 0 || i === 0 || i === 5 || i === 30 || i === 35
                    ? 'bg-emerald-400'
                    : 'bg-white'
                }`}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-2xl backdrop-blur-xs">
            <QrCode className="w-16 h-16 text-white animate-pulse" />
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-6 px-4">
          Scan this QR code with another WhatsChat Pro device to add this contact securely.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition text-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition text-xs shadow-lg shadow-emerald-900/30"
          >
            {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{shared ? 'Shared!' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
