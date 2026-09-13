"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { Film, Wifi, WifiOff } from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { useSync } from "@/hooks/useSync";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useToast } from "@/components/ui/ToastProvider";
import { formatTime } from "@/lib/formatTime";
import RoomHeader from "@/components/room/RoomHeader";
import VideoPlayer, { VideoPlayerHandle } from "@/components/room/VideoPlayer";
import ReactionOverlay, { ReactionOverlayHandle } from "@/components/room/ReactionOverlay";
import SettingsModal from "@/components/room/SettingsModal";
import ChatPanel from "@/components/room/ChatPanel";
import ParticipantPanel from "@/components/room/ParticipantPanel";

// Stable user ID from localStorage
function getUserId(): string {
  if (typeof window === "undefined") return "server";
  const stored = localStorage.getItem("wt_user_id");
  if (stored) return stored;
  const newId = Math.random().toString(36).slice(2, 10);
  localStorage.setItem("wt_user_id", newId);
  return newId;
}

interface NamePromptProps {
  roomId: string;
  onConfirm: (name: string) => void;
}

function NamePrompt({ roomId, onConfirm }: NamePromptProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    localStorage.setItem("wt_display_name", name.trim());
    onConfirm(name.trim());
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Film className="w-5 h-5 text-accent" />
          <span className="font-bold">Aahil and Moomina</span>
        </div>
        <h1 className="text-xl font-bold mb-1">Join room</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Room <span className="font-mono text-foreground">{roomId}</span> · Enter your name to join.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            minLength={2}
            required
          />
          <button
            type="submit"
            disabled={name.trim().length < 2}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Join Room
          </button>
        </form>
      </div>
    </main>
  );
}

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId] = useState(() => getUserId());
  const [isCheckingName, setIsCheckingName] = useState(true);
  const [callEnabled, setCallEnabled] = useState(false);
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const [kickedUserIds, setKickedUserIds] = useState<Set<string>>(new Set());

  const [showSettings, setShowSettings] = useState(false);
  const [audioDeviceId, setAudioDeviceId] = useState<string>("");
  const [videoDeviceId, setVideoDeviceId] = useState<string>("");

  const onPin = useCallback((id: string) => {
    setFocusedParticipantId((prev) => (prev === id ? null : id));
  }, []);

  const videoRef = useRef<VideoPlayerHandle>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("wt_display_name");
    setDisplayName(storedName);
    setIsCheckingName(false);
  }, []);

  const handleNameConfirm = useCallback((name: string) => {
    setDisplayName(name);
  }, []);

  const { room, participants: rawParticipants, isHost, updateVideoUrl, isLoading, error } = useRoom(
    roomId,
    userId,
    displayName ?? ""
  );

  const participants = rawParticipants.filter(p => !kickedUserIds.has(p.id));

  const { toast } = useToast();

  const handlePlay = useCallback((currentTime: number, triggerUserId: string) => {
    videoRef.current?.seek(currentTime);
    videoRef.current?.play();
    const user = participants.find((p) => p.id === triggerUserId);
    if (user) toast(`${user.name} started playback`, "info");
  }, [participants, toast]);

  const handlePause = useCallback((currentTime: number, triggerUserId: string) => {
    videoRef.current?.seek(currentTime);
    videoRef.current?.pause();
    const user = participants.find((p) => p.id === triggerUserId);
    if (user) toast(`${user.name} paused the video`, "info");
  }, [participants, toast]);

  const handleSeek = useCallback((currentTime: number, triggerUserId: string) => {
    videoRef.current?.seek(currentTime);
    const user = participants.find((p) => p.id === triggerUserId);
    if (user) toast(`${user.name} jumped to ${formatTime(currentTime)}`, "info");
  }, [participants, toast]);

  const previousParticipantsRef = useRef(participants);
  useEffect(() => {
    const prev = previousParticipantsRef.current;
    
    // Find new participants
    participants.forEach(p => {
      if (!prev.find(old => old.id === p.id) && p.id !== userId) {
        toast(`${p.name} joined the room`, "success");
      }
    });

    // Find left participants
    prev.forEach(p => {
      if (!participants.find(curr => curr.id === p.id) && p.id !== userId) {
        toast(`${p.name} left the room`, "info");
      }
    });

    previousParticipantsRef.current = participants;
  }, [participants, toast, userId]);

  // Playback sync — all participants can control
  const reactionOverlayRef = useRef<ReactionOverlayHandle>(null);
  
  const handleReaction = useCallback((emoji: string, triggerUserId: string) => {
    reactionOverlayRef.current?.addReaction(emoji);
  }, []);

  const { isConnected: isSyncConnected, socket, emitPlay, emitPause, emitSeek, emitKick, emitReaction } = useSync({
    roomId,
    userId,
    onPlay: handlePlay,
    onPause: handlePause,
    onSeek: handleSeek,
    onReaction: handleReaction,
  });

  const handleKick = useCallback(async (targetId: string) => {
    // 1. Optimistically hide them
    setKickedUserIds(prev => new Set(prev).add(targetId));
    if (focusedParticipantId === targetId) {
      setFocusedParticipantId(null);
    }
    
    // 2. Delete them from the database so they don't come back on refresh
    try {
      const { supabase } = await import("@/lib/supabase");
      await supabase
        .from("room_members")
        .delete()
        .match({ room_id: roomId, user_id: targetId });
    } catch (e) {
      console.error("Failed to delete member from DB", e);
    }

    // 3. Force their browser to leave the room via socket
    emitKick(targetId);
  }, [emitKick, focusedParticipantId, roomId]);

  // WebRTC video/audio calling
  const {
    localStream,
    remoteStreams,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    error: webRTCError,
  } = useWebRTC({
    roomId,
    userId,
    socket,
    enabled: callEnabled,
    participants,
    audioDeviceId,
    videoDeviceId,
  });

  if (isCheckingName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!displayName) {
    return <NamePrompt roomId={roomId} onConfirm={handleNameConfirm} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Joining room...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Room not found</h1>
          <p className="text-muted-foreground">
            This room may have expired or the link may be incorrect.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      <RoomHeader
        roomId={roomId}
        participantCount={participants.length}
        isHost={isHost}
        videoUrl={room.videoUrl}
        onUpdateVideoUrl={updateVideoUrl}
        onInvite={() => {}}
        onSettings={() => setShowSettings(true)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        selectedMic={audioDeviceId}
        selectedCam={videoDeviceId}
        onSelectMic={setAudioDeviceId}
        onSelectCam={setVideoDeviceId}
      />

      {/* Sync status indicator */}
      {!isSyncConnected && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-1.5 flex items-center gap-2 text-xs text-yellow-500">
          <WifiOff className="w-3.5 h-3.5" />
          Reconnecting to sync server...
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Video area */}
        <div className="flex-1 bg-black/95 flex flex-col min-h-0 min-w-0 relative group">
          <ReactionOverlay ref={reactionOverlayRef} />
          {(() => {
            const focusedStream = focusedParticipantId 
              ? (focusedParticipantId === userId ? localStream : remoteStreams.find(r => r.userId === focusedParticipantId)?.stream)
              : null;
            const focusedParticipant = participants.find(p => p.id === focusedParticipantId);

            if (focusedStream && focusedParticipant) {
              return (
                <div className="flex-1 relative bg-black">
                  <video
                    ref={(el) => {
                      if (el && focusedStream) el.srcObject = focusedStream;
                    }}
                    autoPlay
                    playsInline
                    muted={focusedParticipantId === userId}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <span className="text-white font-medium drop-shadow-md text-lg">
                      {focusedParticipant.name} {focusedParticipantId === userId && "(you)"}
                    </span>
                  </div>
                  <button
                    onClick={() => setFocusedParticipantId(null)}
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-md text-sm backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    Close Pin
                  </button>
                </div>
              );
            }

            return (
              <VideoPlayer
                ref={videoRef}
                roomId={roomId}
                videoUrl={room.videoUrl}
                onPlay={emitPlay}
                onPause={emitPause}
                onSeek={emitSeek}
              />
            );
          })()}
        </div>

        {/* Right sidebar */}
        <div className="w-full md:w-[360px] lg:w-[400px] bg-card border-t md:border-t-0 md:border-l border-border flex flex-col flex-shrink-0 min-h-0 max-h-[50vh] md:max-h-none">
          {/* Participants + call controls */}
          <div className="border-b border-border flex-shrink-0">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Participants · {participants.length}
              </span>
              <div className="flex items-center gap-1">
                {isSyncConnected ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-yellow-400" />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {isSyncConnected ? "Synced" : "Reconnecting"}
                </span>
              </div>
            </div>
            <ParticipantPanel
              participants={participants}
              currentUserId={userId}
              currentUserIsHost={isHost}
              localStream={localStream}
              remoteStreams={remoteStreams}
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
              isScreenSharing={isScreenSharing}
              isCallEnabled={callEnabled}
              onToggleMic={toggleMic}
              onToggleCamera={toggleCamera}
              onToggleScreenShare={toggleScreenShare}
              onEnableCall={() => setCallEnabled(true)}
              onKick={handleKick}
              onPin={onPin}
              webRTCError={webRTCError}
            />
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0">
            <ChatPanel
              roomId={roomId}
              currentUserId={userId}
              currentUserName={displayName}
              onSendReaction={emitReaction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}