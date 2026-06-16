import { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onLoadedMetadata?: (duration: number) => void;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
}

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function AudioPlayer({
  src,
  currentTime,
  onTimeUpdate,
  onPlay,
  onPause,
  onLoadedMetadata,
  isPlaying,
  onPlayStateChange,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showRateMenu, setShowRateMenu] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (Math.abs(audio.currentTime - currentTime) > 0.1) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (audio) {
      onTimeUpdate(audio.currentTime);
    }
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
      onLoadedMetadata?.(audio.duration);
    }
  }

  function togglePlay() {
    onPlayStateChange(!isPlaying);
    if (!isPlaying) {
      onPlay?.();
    } else {
      onPause?.();
    }
  }

  function skip(seconds: number) {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    setIsMuted(!isMuted);
    audio.muted = !isMuted;
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
    if (v > 0 && isMuted) {
      setIsMuted(false);
    }
  }

  function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-primary-900 text-white rounded-lg p-4">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => onPlayStateChange(false)}
      />

      <div
        className="h-2 bg-primary-700 rounded-full cursor-pointer mb-4 group"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-accent-400 rounded-full relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => skip(-10)}
            className="p-2 hover:bg-primary-700 rounded-full transition-colors"
            title="后退10秒"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            className="p-3 bg-accent-500 hover:bg-accent-600 rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button
            onClick={() => skip(10)}
            className="p-2 hover:bg-primary-700 rounded-full transition-colors"
            title="前进10秒"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <span className="text-sm text-primary-200 font-mono ml-2">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowRateMenu(!showRateMenu)}
              className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-primary-700 rounded transition-colors"
            >
              <Gauge className="w-4 h-4" />
              <span>{playbackRate}x</span>
            </button>
            {showRateMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-primary-800 rounded-lg shadow-lg py-1 z-10">
                {playbackRates.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowRateMenu(false);
                    }}
                    className={cn(
                      'block w-full px-4 py-1.5 text-sm text-left hover:bg-primary-700 transition-colors',
                      playbackRate === rate && 'text-accent-400'
                    )}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-primary-700 rounded-full transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-primary-700 rounded-full appearance-none cursor-pointer accent-accent-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
