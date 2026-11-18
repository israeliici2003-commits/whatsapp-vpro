import React, { useState } from 'react';
import { Lock, Fingerprint, Delete } from 'lucide-react';
import { translations, LanguageKey } from '../i18n';
import { webAuthnService } from '../services/webAuthnService';

interface LockScreenProps {
  onUnlock: () => void;
  language: LanguageKey;
  correctPin?: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, language, correctPin = '1234' }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricMessage, setBiometricMessage] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const t = translations[language];

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      setBiometricMessage(null);
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleBiometricUnlock = async () => {
    setAuthenticating(true);
    setBiometricMessage(null);
    const available = await webAuthnService.isWebAuthnAvailable();
    if (!available) {
      setAuthenticating(false);
      setBiometricMessage('Biometric sensor unavailable in this browser. Please enter PIN.');
      return;
    }
    const success = await webAuthnService.authenticateBiometric();
    setAuthenticating(false);
    if (success) {
      onUnlock();
    } else {
      setBiometricMessage('Biometric verification failed or cancelled. Please enter PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col items-center justify-center p-6 select-none">
      <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/30">
        <Lock className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-2xl font-bold mb-2">WhatsChat Pro</h1>
      <p className={`mb-8 text-center text-sm ${error || biometricMessage ? 'text-amber-300' : 'text-slate-400'}`}>
        {authenticating
          ? 'Verifying biometric fingerprint / FaceID...'
          : error
          ? `Incorrect PIN (Try ${correctPin})`
          : biometricMessage || t.enterPin}
      </p>

      {/* PIN Dots */}
      <div className="flex gap-4 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i < pin.length
                ? error ? 'bg-rose-500 scale-110' : 'bg-emerald-500 scale-110'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-5 w-72 max-w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            onClick={() => handleNumClick(num)}
            className="w-16 h-16 mx-auto rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-2xl font-semibold flex items-center justify-center transition"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleBiometricUnlock}
          className="w-16 h-16 mx-auto rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-emerald-400 transition animate-pulse"
          title="Fingerprint / FaceID Unlock"
        >
          <Fingerprint className="w-7 h-7" />
        </button>
        <button
          onClick={() => handleNumClick('0')}
          className="w-16 h-16 mx-auto rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-2xl font-semibold flex items-center justify-center transition"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 mx-auto rounded-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 flex items-center justify-center text-slate-300 transition"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-8 text-xs text-slate-500">
        Default PIN: <span className="text-emerald-400 font-mono font-bold">1234</span>
      </div>
    </div>
  );
};
