import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { VideoState } from '@/types';
import { formatTime } from '@/lib/formatTime';
import { Button } from '@/components/ui/button';

interface VideoControlsProps {
  state: VideoState;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onFullscreen: () => void;
}

export default function VideoControls({ state, onPlay, onPause, onSeek, onVolumeChange, onMute, onFullscreen }: VideoControlsProps) {
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value));
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  return (
    <div className="w-full h-full flex items-center px-4 gap-4">
      <Button variant="ghost" size="icon" onClick={state.playing ? onPause : onPlay}>
        {state.playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
      </Button>

      <div className="flex-1 flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground min-w-[40px] text-right">
          {formatTime(state.currentTime)}
        </span>
        
        <input 
          type="range" 
          min="0" 
          max={state.duration || 100} 
          value={state.currentTime || 0} 
          onChange={handleSeek}
          className="flex-1 h-1 bg-border rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
        />
        
        <span className="text-xs font-mono text-muted-foreground min-w-[40px]">
          {formatTime(state.duration)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMute}>
          {state.muted || state.volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05"
          value={state.muted ? 0 : state.volume} 
          onChange={handleVolume}
          className="w-16 md:w-20 h-1 bg-border rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:rounded-full cursor-pointer hidden sm:block"
        />
      </div>

      <Button variant="ghost" size="icon" onClick={onFullscreen}>
        <Maximize className="w-5 h-5" />
      </Button>
    </div>
  );
}
