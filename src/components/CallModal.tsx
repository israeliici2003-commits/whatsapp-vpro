import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, Camera, ShieldCheck } from 'lucide-react';
import { translations, LanguageKey } from '../i18n';
import { WebRTCService } from '../services/webrtcService';

interface CallModalProps {
  contactName: string;
  contactAvatar: string;
  callType: 'voice' | 'video';
  onEndCall: (duration: number) => void;
  language: LanguageKey;
}

export const CallModal: React.FC<CallModalProps> = ({
  contactName,
  contactAvatar,
  callType,
  onEndCall,
  language
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [status, setStatus] = useState<'ringing' | 'connected'>('ringing');
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(0);
  const endedRef = useRef(false);
  const onEndCallRef = useRef(onEndCall);
  const videoRef = useRef<HTMLVideoElement>(null);
  const webrtcRef = useRef<WebRTCService | null>(null);
  const t = translations[language];

  useEffect(() => {
    onEndCallRef.current = onEndCall;
  }, [onEndCall]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const finishCall = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    onEndCallRef.current(durationRef.current);
  };

  useEffect(() => {
    endedRef.current = false;
    // Initialize WebRTC P2P service
    const webrtc = new WebRTCService({
      onRemoteStream: (stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      },
      onCallStateChange: (state) => {
        if (state === 'connected') {
          setStatus('connected');
        } else if (state === 'ended') {
          finishCall();
        }
      },
    });

    webrtcRef.current = webrtc;

    webrtc.startCall(callType === 'video').then((localStream) => {
      if (videoRef.current && callType === 'video') {
        videoRef.current.srcObject = localStream;
      }
    });

    const ringTimer = setTimeout(() => {
      setStatus('connected');
    }, 2000);

    return () => {
      clearTimeout(ringTimer);
      webrtc.endCall(false);
    };
  }, [callType]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (status === 'connected') {
      interval = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    webrtcRef.current?.setAudioEnabled(!nextMuted);
  };

  const handleToggleVideo = () => {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);
    webrtcRef.current?.setVideoEnabled(!nextVideoOff);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Background Video / Avatar */}
      {callType === 'video' && !isVideoOff ? (
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900" />
          <div className="relative text-center">
            <img
              src={contactAvatar}
              alt={contactName}
              className="w-36 h-36 rounded-full object-cover mx-auto mb-6 shadow-2xl border-4 border-emerald-500/40 animate-pulse"
            />
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="relative z-10 flex justify-between items-center pt-4">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-medium border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>WebRTC P2P Encrypted</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">
            {callType === 'video' ? t.callVideo : t.callVoice}
          </p>
        </div>
      </div>

      {/* Middle Info */}
      <div className="relative z-10 text-center my-auto">
        <h2 className="text-3xl font-bold mb-2 drop-shadow-md">{contactName}</h2>
        <p className="text-emerald-400 font-mono text-sm font-semibold">
          {status === 'ringing' ? t.ringing : formatDuration(duration)}
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 pb-8 flex items-center justify-center gap-6">
        <button
          onClick={handleToggleMute}
          className={`p-4 rounded-full transition ${
            isMuted ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
          }`}
          title={isMuted ? 'Unmute' : t.mute}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {callType === 'video' && (
          <button
            onClick={handleToggleVideo}
            className={`p-4 rounded-full transition ${
              isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
            }`}
            title={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        <button
          onClick={() => setIsSpeaker(!isSpeaker)}
          className={`p-4 rounded-full transition ${
            isSpeaker ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
          }`}
          title={t.speaker}
        >
          <Volume2 className="w-6 h-6" />
        </button>

        <button
          onClick={() => {
            webrtcRef.current?.endCall(false);
            finishCall();
          }}
          className="p-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/50 transition transform hover:scale-105 active:scale-95"
          title={t.endCall}
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
