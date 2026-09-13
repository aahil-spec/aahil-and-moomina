"use client";

import { useRef, useEffect } from "react";
import { Mic, MicOff, Crown, VideoOff, X, Maximize } from "lucide-react";
import { Participant } from "@/types";

interface ParticipantVideoProps {
  participant: Participant;
  stream?: MediaStream | null;
  isLocal?: boolean;
  currentUserIsHost?: boolean;
  onKick?: (userId: string) => void;
  onPin?: (userId: string) => void;
}

export default function ParticipantVideo({
  participant,
  stream,
  isLocal,
  currentUserIsHost,
  onKick,
  onPin,
}: ParticipantVideoProps) {
  const initials = participant.name.substring(0, 2).toUpperCase();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const showVideo = !!stream;

  return (
    <div className="relative w-28 h-24 sm:w-32 sm:h-28 rounded-xl overflow-hidden bg-background border border-border flex-shrink-0 flex items-center justify-center group">
      {/* Live video feed */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // always mute local to avoid echo
          className="w-full h-full object-cover"
        />
      ) : (
        /* Avatar / no-camera state */
        <div
          className={`w-full h-full flex flex-col items-center justify-center gap-1 ${participant.color} bg-opacity-10`}
        >
          <span
            className={`text-2xl font-bold ${participant.color.replace(
              "bg-",
              "text-"
            )}`}
          >
            {initials}
          </span>
          {stream && !participant.isCameraOn && (
            <VideoOff className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Kick button (only visible to host, and only on remote users) */}
      {currentUserIsHost && !isLocal && (
        <button
          onClick={() => onKick?.(participant.id)}
          className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/60 hover:bg-destructive/80 transition-colors backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer z-10"
          title="Kick user"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Pin button */}
      {showVideo && (
        <button
          onClick={() => onPin?.(participant.id)}
          className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-black/80 transition-colors backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer z-10"
          title="Pin to main stage"
        >
          <Maximize className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Mic indicator (moved slightly if it conflicts, but let's put pin on top right and mic on bottom right? Actually mic is top right right now. Let's move pin next to mic) */}

      {/* Name + host badge */}
      <div className="absolute bottom-1.5 left-2 right-2 flex items-center gap-1 overflow-hidden">
        <span className="text-[10px] font-medium text-white truncate drop-shadow-md">
          {participant.name}
          {isLocal && (
            <span className="text-accent ml-1">(you)</span>
          )}
        </span>
        {participant.isHost && (
          <Crown className="w-3 h-3 text-yellow-400 drop-shadow-md flex-shrink-0" />
        )}
      </div>

      {/* Mic indicator */}
      <div className="absolute top-1.5 right-8 w-5 h-5 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-none">
        {participant.isMicOn ? (
          <Mic className="w-3 h-3 text-green-400" />
        ) : (
          <MicOff className="w-3 h-3 text-red-400" />
        )}
      </div>
    </div>
  );
}
