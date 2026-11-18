import React, { useState } from 'react';
import { Phone, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { translations, LanguageKey } from '../i18n';

interface AuthScreenProps {
  onLoginSuccess: (phone: string, name: string) => void;
  language: LanguageKey;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, language }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+254 712 345 678');
  const [name, setName] = useState('Alex Developer');
  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const t = translations[language];

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(phone, name);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
            💬
          </div>
          <div>
            <h1 className="text-xl font-bold">WhatsChat Pro</h1>
            <p className="text-xs text-slate-400">Secure Internet & SMS Messaging</p>
          </div>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                placeholder="e.g. Alex Developer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {t.phoneNumber}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-500">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                  placeholder="+254 700 000 000"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                SMS verification code will be sent to this number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/30 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-200">
                <span className="font-semibold block mb-1">OTP Verification SMS Sent</span>
                We sent a 6-digit code via SMS to <span className="font-mono font-bold">{phone}</span>.
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                {t.enterOtp}
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/30 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{t.verify}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
