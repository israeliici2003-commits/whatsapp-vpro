import React, { useEffect, useState } from 'react';
import { Shield, Lock, Key, CheckCircle2, X, Cpu, Database, RefreshCw } from 'lucide-react';
import { generateSafetyNumber } from '../crypto/signalProtocol';
import { encryptionService } from '../services/encryptionService';
import { LanguageKey } from '../i18n';

interface EncryptionDetailsModalProps {
  chatId?: string;
  contactName: string;
  contactPhone: string;
  onClose: () => void;
  language: LanguageKey;
}

export const EncryptionDetailsModal: React.FC<EncryptionDetailsModalProps> = ({
  chatId,
  contactName,
  contactPhone,
  onClose,
}) => {
  const peerKey = chatId || contactPhone;
  const [safetyNumber, setSafetyNumber] = useState(() =>
    generateSafetyNumber(contactPhone, 'user_me_identity')
  );
  const [sessionReady, setSessionReady] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    cipherTextPreview: string;
    decryptedText: string;
    matched: boolean;
  } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let active = true;
    encryptionService.ensureSession(peerKey).then((session) => {
      if (!active) return;
      setSafetyNumber(session.safetyNumber);
      setSessionReady(true);
      setMessageCount(session.sendCounter);
      setIsVerified(session.verified);
    });
    return () => {
      active = false;
    };
  }, [peerKey]);

  const handleToggleVerify = () => {
    const next = !isVerified;
    encryptionService.markSessionVerified(peerKey, next);
    setIsVerified(next);
  };

  const handleRunRoundTripTest = async () => {
    setTesting(true);
    try {
      const result = await encryptionService.verifyEndToEndRoundTrip(
        peerKey,
        `Signal X3DH verified for ${contactName}`
      );
      setVerificationResult(result);
      const info = encryptionService.getSessionInfo(peerKey);
      setMessageCount(info.sendCounter);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">End-to-End Encryption</h2>
              <p className="text-[11px] text-slate-400">
                Signal Protocol (X3DH + AES-GCM-256)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {/* Status banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200 leading-relaxed flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold">Messages with {contactName} are secured</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {sessionReady ? `X3DH Active • #${messageCount}` : 'Initializing X3DH...'}
                </span>
              </div>
              Messages sent over Internet mode are encrypted using X3DH key agreement and AES-GCM-256 per-message ratchet keys.
            </div>
          </div>

          {/* Safety Number Verification */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Safety Number Verification
              </span>
              <Key className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300">
              Compare this cryptographic SHA-256 safety number with {contactName} to verify your X3DH identity keys:
            </p>
            <div className="bg-slate-900 border border-slate-800 font-mono text-center text-emerald-400 font-bold text-lg py-3 rounded-xl tracking-widest shadow-inner">
              {safetyNumber}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleToggleVerify}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                  isVerified
                    ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isVerified ? 'Marked as Verified' : 'Mark as Verified'}</span>
              </button>
              <button
                type="button"
                onClick={handleRunRoundTripTest}
                disabled={testing || !sessionReady}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-white transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Verify X3DH Cipher</span>
              </button>
            </div>

            {verificationResult && (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-3 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span>Responder X3DH Decryption</span>
                  <span>{verificationResult.matched ? 'PASS (AES-256-GCM)' : 'MISMATCH'}</span>
                </div>
                <p className="font-mono text-slate-400 truncate">
                  Cipher: {verificationResult.cipherTextPreview}
                </p>
                <p className="text-slate-200 truncate">
                  Plaintext: {verificationResult.decryptedText}
                </p>
              </div>
            )}
          </div>

          {/* Key Management Architecture */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Signal Protocol Architecture
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-3 bg-slate-950/30 p-3 rounded-xl border border-slate-800/80">
                <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">
                    1. Identity & Signed PreKeys (ECDH + ECDSA P-256)
                  </span>
                  Identity keys, ECDSA-signed PreKeys, and One-Time PreKeys are generated via Web Crypto API.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/30 p-3 rounded-xl border border-slate-800/80">
                <Database className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">
                    2. X3DH Shared Secret Agreement
                  </span>
                  Four Diffie-Hellman exchanges (IK, SPK, OPK, EK) combine through HKDF-SHA256 to establish a 256-bit session root key.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/30 p-3 rounded-xl border border-slate-800/80">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">
                    3. Ratchet Keys & AES-GCM 256
                  </span>
                  Each message derives a unique key from the root key and ratchet counter before encrypting the <code className="text-emerald-400 font-mono">Message.encryptedPayload</code>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
