import { Film, Users, Settings } from 'lucide-react';
import InviteButton from './InviteButton';
import { Button } from '@/components/ui/button';

interface RoomHeaderProps {
  roomId: string;
  participantCount: number;
  isHost: boolean;
  videoUrl?: string | null;
  onUpdateVideoUrl: (url: string) => void;
  onInvite: () => void;
  onSettings: () => void;
}

export default function RoomHeader({ roomId, participantCount, isHost, videoUrl, onUpdateVideoUrl, onSettings }: RoomHeaderProps) {
  return (
    <header className="h-auto min-h-14 bg-card border-b border-border flex flex-col sm:flex-row items-center justify-between px-2 sm:px-4 py-2 gap-2 flex-shrink-0">
      <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-4">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-accent" />
          <span className="font-bold hidden md:inline">Aahil and Moomina</span>
        </div>
        
        <div className="flex sm:hidden items-center gap-2">
          <div className="px-2 py-1 bg-background rounded-md text-xs font-mono text-muted-foreground border border-border">
            {roomId}
          </div>
          <InviteButton roomId={roomId} />
          <Button variant="ghost" size="icon" onClick={onSettings} className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 w-full sm:flex-1 justify-center px-0 sm:px-4">
        {isHost ? (
          <div className="flex items-center gap-2 w-full max-w-md">
            <input 
              id="video-url-input"
              defaultValue={videoUrl || ""} 
              placeholder="Paste YouTube or MP4 link..." 
              className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent transition-colors min-w-0"
            />
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => {
                const input = document.getElementById('video-url-input') as HTMLInputElement;
                const url = input?.value?.trim();
                if (url) onUpdateVideoUrl(url);
              }}
            >
              Change
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground truncate max-w-md w-full text-center bg-background px-3 py-1.5 rounded-md border border-border">
            {videoUrl ? "Watching custom video" : "Watching Big Buck Bunny"}
          </div>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-3">
        <div className="px-3 py-1.5 bg-background rounded-md text-sm font-mono text-muted-foreground border border-border flex items-center gap-2">
          <span>{roomId}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground px-2">
          <Users className="w-4 h-4" />
          <span>{participantCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <InviteButton roomId={roomId} />
          <Button variant="ghost" size="icon" onClick={onSettings}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
