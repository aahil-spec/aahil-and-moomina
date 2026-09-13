"use client";

import { Participant } from "@/types";
import ParticipantVideo from "./ParticipantVideo";
import { RemoteStream } from "@/hooks/useWebRTC";
import { Mic, MicOff, Video, VideoOff, Loader2, MonitorUp, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParticipantPanelProps {
  participants: Participant[];
  currentUserId: string;
  currentUserIsHost: boolean;
  localStream: MediaStream | null;
  remoteStreams: RemoteStream[];
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isCallEnabled: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEnableCall: () => void;
  onKick: (userId: string) => void;
  onPin: (userId: string) => void;
  webRTCError: string | null;
}

export default function ParticipantPanel({
  participants,
  currentUserId,
  currentUserIsHost,
  localStream,
  remoteStreams,
  isMicOn,
  isCameraOn,
  isScreenSharing,
  isCallEnabled,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onEnableCall,
  onKick,
  onPin,
  webRTCError,
}: ParticipantPanelProps) {
  const getStreamForParticipant = (participantId: string): MediaStream | null => {
    if (participantId === currentUserId) return localStream;
    return remoteStreams.find((r) => r.userId === participantId)?.stream ?? null;
  };

  const getParticipantWithLiveState = (p: typeof participants[0]) => {
    if (p.id === currentUserId) {
      return { ...p, isMicOn, isCameraOn };
    }
    return p;
  };

  return (
    <div className="w-full flex flex-col flex-shrink-0">
      {/* Video tiles */}
      <div className="p-3 flex gap-3 overflow-x-auto items-center flex-nowrap scrollbar-hide">
        {participants.length === 0 ? (
          <div className="w-full text-center text-sm text-muted-foreground">
            Waiting for others to join...
          </div>
        ) : (
          participants.map((p) => (
            <ParticipantVideo
              key={p.id}
              participant={getParticipantWithLiveState(p)}
              stream={getStreamForParticipant(p.id)}
              isLocal={p.id === currentUserId}
              currentUserIsHost={currentUserIsHost}
              onKick={onKick}
              onPin={onPin}
            />
          ))
        )}
      </div>

      {/* Call controls */}
      <div className="flex-shrink-0 border-t border-border px-4 py-2 flex items-center justify-center gap-2">
        {!isCallEnabled ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={onEnableCall}
            className="gap-2 text-xs"
          >
            <Video className="w-4 h-4" />
            Enable Camera &amp; Mic
          </Button>
        ) : (
          <>
            {webRTCError ? (
              <span className="text-xs text-destructive">{webRTCError}</span>
            ) : !localStream ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Starting camera...
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={isMicOn ? "secondary" : "destructive"}
                  onClick={onToggleMic}
                  className="gap-1.5 text-xs h-8 px-2.5"
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={isCameraOn ? "secondary" : "destructive"}
                  onClick={onToggleCamera}
                  className="gap-1.5 text-xs h-8 px-2.5"
                >
                  {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={isScreenSharing ? "default" : "secondary"}
                  onClick={onToggleScreenShare}
                  className="gap-1.5 text-xs h-8 px-2.5"
                  title="Share Screen"
                >
                  {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <MonitorUp className="w-4 h-4" />}
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}