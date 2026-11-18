import React from 'react';
import { Shield, Lock, Database, Globe, Moon, Smartphone, ArrowLeft, ChevronRight, QrCode, Image as ImageIcon } from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import { translations } from '../i18n';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onOpenStorageScreen: () => void;
  onOpenQrModal: () => void;
  onLockApp?: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  userProfile,
  onUpdateProfile,
  onOpenStorageScreen,
  onOpenQrModal,
  onLockApp,
  onBack,
}) => {
  const t = translations[settings.language];

  const wallpaperOptions = [
    { id: 'doodles', label: 'Classic Doodles', swatch: settings.theme === 'light' ? '#efeae2' : '#0b141a' },
    { id: 'forest', label: 'Forest Green', swatch: '#0a261c' },
    { id: 'ocean', label: 'Ocean Blue', swatch: '#0b192c' },
    { id: 'midnight', label: 'Midnight Black', swatch: '#050505' },
  ];

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
        <h1 className="text-xl font-bold">{t.settings}</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
          <img
            src={userProfile.avatar}
            alt={userProfile.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
          />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={userProfile.name}
              onChange={(e) => onUpdateProfile({ name: e.target.value })}
              className="bg-transparent font-bold text-lg w-full focus:outline-none focus:border-b border-emerald-500"
            />
            <input
              type="text"
              value={userProfile.about}
              onChange={(e) => onUpdateProfile({ about: e.target.value })}
              className="bg-transparent text-xs text-slate-400 w-full focus:outline-none focus:border-b border-emerald-500 mt-1"
            />
          </div>
          <button
            onClick={onOpenQrModal}
            className="p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center shrink-0"
            title="Show Profile QR Code"
          >
            <QrCode className="w-6 h-6" />
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {/* Account & Security */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-sm">{t.privacyAndSecurity}</h4>
                  <p className="text-xs text-slate-400">End-to-end encryption, PIN lock</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.securityLock}
                onChange={(e) => onUpdateSettings({ securityLock: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-sm">Biometric Unlock</h4>
                  <p className="text-xs text-slate-400">Fingerprint or Face unlock</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.biometricLock}
                onChange={(e) => onUpdateSettings({ biometricLock: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {settings.securityLock && onLockApp && (
              <div className="p-4 flex items-center justify-between bg-slate-900/60">
                <div>
                  <h4 className="font-semibold text-sm">App Lock Screen</h4>
                  <p className="text-xs text-slate-400">Default PIN: 1234</p>
                </div>
                <button
                  onClick={onLockApp}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                >
                  Lock App Now
                </button>
              </div>
            )}
          </div>

          {/* Appearance & Language */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-sm">{t.language} / Lugha</h4>
                  <p className="text-xs text-slate-400">English / Swahili (Kiswahili)</p>
                </div>
              </div>
              <select
                value={settings.language}
                onChange={(e) => onUpdateSettings({ language: e.target.value as 'en' | 'sw' })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="en">English</option>
                <option value="sw">Kiswahili (Swahili)</option>
              </select>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-sm">Theme / Appearance</h4>
                  <p className="text-xs text-slate-400">Dark, Light or System mode</p>
                </div>
              </div>
              <select
                value={settings.theme}
                onChange={(e) => onUpdateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </div>

          {/* Network Mode & SIM Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-sm">Default SIM for SMS Mode</h4>
                  <p className="text-xs text-slate-400">Dual-SIM routing preference</p>
                </div>
              </div>
              <select
                value={settings.defaultSim}
                onChange={(e) => onUpdateSettings({ defaultSim: e.target.value as 'SIM 1' | 'SIM 2' })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="SIM 1">SIM 1 (Safaricom)</option>
                <option value="SIM 2">SIM 2 (Airtel)</option>
              </select>
            </div>
          </div>

          {/* Chat Wallpaper */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-sm">{t.wallpaper}</h4>
                  <p className="text-xs text-slate-400">Theme-aware chat background</p>
                </div>
              </div>
              <select
                value={settings.wallpaper || 'doodles'}
                onChange={(e) => onUpdateSettings({ wallpaper: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {wallpaperOptions.map((wp) => (
                  <option key={wp.id} value={wp.id}>
                    {wp.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {wallpaperOptions.map((wp) => {
                const active = (settings.wallpaper || 'doodles') === wp.id;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => onUpdateSettings({ wallpaper: wp.id })}
                    className={`p-2 rounded-xl border text-[11px] font-medium flex flex-col items-center gap-1.5 transition ${
                      active ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-full h-6 rounded-lg border border-white/10"
                      style={{ backgroundColor: wp.swatch }}
                    />
                    <span className="truncate w-full text-center">{wp.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Storage & Data (Clickable to open DataStorageScreen) */}
          <div
            onClick={onOpenStorageScreen}
            className="bg-slate-900 hover:bg-slate-800/80 cursor-pointer border border-slate-800 rounded-2xl p-4 flex items-center justify-between transition"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-semibold text-sm">{t.storageAndData}</h4>
                <p className="text-xs text-slate-400">Network usage, storage, and auto-download</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
