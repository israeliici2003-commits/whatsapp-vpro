import React from 'react';
import { Shield, Globe, Moon, Smartphone, Database, HelpCircle, LogOut } from 'lucide-react';
import { AppSettings, UserProfile } from '../../types';
import { translations } from '../../i18n';

interface SettingsTabProps {
  settings: AppSettings;
  userProfile: UserProfile;
  onOpenSettingsScreen: () => void;
  onLogout: () => void;
  language: AppSettings['language'];
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  userProfile,
  onOpenSettingsScreen,
  onLogout,
  language
}) => {
  const t = translations[language];

  return (
    <div className="flex flex-col h-full bg-[#111b21] text-white select-none overflow-y-auto p-4 space-y-4">
      {/* Profile Card Header */}
      <div
        onClick={onOpenSettingsScreen}
        className="flex items-center gap-4 bg-[#202c33] p-4 rounded-2xl cursor-pointer hover:bg-[#2a3942] transition shadow"
      >
        <img
          src={userProfile.avatar}
          alt={userProfile.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate">{userProfile.name}</h3>
          <p className="text-xs text-slate-400 truncate">{userProfile.about}</p>
          <p className="text-[11px] font-mono text-emerald-400 mt-1">{userProfile.phone}</p>
        </div>
      </div>

      {/* Menu Options */}
      <div className="bg-[#202c33] rounded-2xl overflow-hidden divide-y divide-slate-800">
        <div
          onClick={onOpenSettingsScreen}
          className="flex items-center gap-4 p-4 hover:bg-[#2a3942] cursor-pointer transition"
        >
          <Shield className="w-5 h-5 text-emerald-400" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{t.privacyAndSecurity}</h4>
            <p className="text-xs text-slate-400">Lock, PIN, End-to-end encryption</p>
          </div>
        </div>

        <div
          onClick={onOpenSettingsScreen}
          className="flex items-center gap-4 p-4 hover:bg-[#2a3942] cursor-pointer transition"
        >
          <Globe className="w-5 h-5 text-emerald-400" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{t.language} / Lugha</h4>
            <p className="text-xs text-slate-400">{settings.language === 'sw' ? 'Kiswahili (Swahili)' : 'English'}</p>
          </div>
        </div>

        <div
          onClick={onOpenSettingsScreen}
          className="flex items-center gap-4 p-4 hover:bg-[#2a3942] cursor-pointer transition"
        >
          <Moon className="w-5 h-5 text-emerald-400" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Theme & Appearance</h4>
            <p className="text-xs text-slate-400">Dark, Light mode</p>
          </div>
        </div>

        <div
          onClick={onOpenSettingsScreen}
          className="flex items-center gap-4 p-4 hover:bg-[#2a3942] cursor-pointer transition"
        >
          <Smartphone className="w-5 h-5 text-emerald-400" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">SIM & Network Mode</h4>
            <p className="text-xs text-slate-400">Internet vs SMS routing</p>
          </div>
        </div>

        <div
          onClick={onOpenSettingsScreen}
          className="flex items-center gap-4 p-4 hover:bg-[#2a3942] cursor-pointer transition"
        >
          <Database className="w-5 h-5 text-emerald-400" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{t.storageAndData}</h4>
            <p className="text-xs text-slate-400">Room database & cache</p>
          </div>
        </div>

        <div
          onClick={onLogout}
          className="flex items-center gap-4 p-4 hover:bg-rose-600/10 cursor-pointer transition text-rose-400"
        >
          <LogOut className="w-5 h-5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{t.accountDeletion} / Logout</h4>
            <p className="text-xs text-rose-300/80">Sign out of WhatsChat Pro</p>
          </div>
        </div>
      </div>
    </div>
  );
};
