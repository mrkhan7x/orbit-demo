import { NodeViewWrapper } from '@tiptap/react';
import { Play, Pause, Mic } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function VoiceMemoNode(props: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState("0:00");
  const [currentTime, setCurrentTime] = useState("0:00");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onloadedmetadata = () => {
        setDuration(formatTime(audioRef.current!.duration));
      };
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(formatTime(audioRef.current!.currentTime));
        setProgress((audioRef.current!.currentTime / audioRef.current!.duration) * 100);
      };
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime("0:00");
      };
    }
  }, [props.node.attrs.src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <NodeViewWrapper className="voice-memo-node my-4 max-w-sm">
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-indigo-500 shadow-lg text-white">
        <button
          onClick={togglePlay}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors rounded-full backdrop-blur-md"
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
        
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-medium opacity-90">
            <span className="flex items-center gap-1.5"><Mic size={12} /> Voice Memo</span>
            <span>{currentTime} / {duration}</span>
          </div>
          
          <div className="relative h-1.5 bg-black/20 rounded-full overflow-hidden mt-0.5">
            <div 
              className="absolute top-0 left-0 h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      
      <audio ref={audioRef} src={props.node.attrs.src} className="hidden" preload="metadata" />
    </NodeViewWrapper>
  );
}
