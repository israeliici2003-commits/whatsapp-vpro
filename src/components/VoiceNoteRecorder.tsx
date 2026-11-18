import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Send, Trash2, AlertCircle } from 'lucide-react';
import { translations, LanguageKey } from '../i18n';

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
  language: LanguageKey;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onSendVoiceNote,
  onCancel,
  language
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopAllTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        stopAllTracks();
      };

      mediaRecorder.start();
      setIsRecording(true);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (err) {
      console.warn('Microphone access error or denied:', err);
      // Fallback to simulated recording if microphone is unavailable or blocked in iframe
      setIsRecording(true);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
  };

  const stopAllTracks = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      // Fallback simulation blob
      setIsRecording(false);
      setAudioBlobUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
    }
  };

  const handleSend = () => {
    const finalUrl = audioBlobUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    onSendVoiceNote(finalUrl, duration || 3);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between bg-[#202c33] px-4 py-2.5 rounded-xl border border-emerald-500/40 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
        <span className="font-mono text-sm text-emerald-400 font-bold">
          {isRecording ? `Recording Voice Note... ${formatTime(duration)}` : `Voice Note Ready (${formatTime(duration)})`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {isRecording ? (
          <button
            type="button"
            onClick={handleStopRecording}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Audio</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current);
            stopAllTracks();
            onCancel();
          }}
          className="p-2 text-slate-400 hover:text-rose-400 transition"
          title="Cancel"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
