import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSyncOptions {
  roomId: string;
  userId: string;
  onPlay: (currentTime: number, triggerUserId: string) => void;
  onPause: (currentTime: number, triggerUserId: string) => void;
  onSeek: (currentTime: number, triggerUserId: string) => void;
  onReaction?: (emoji: string, userId: string) => void;
  onMediaState?: (userId: string, isMicOn: boolean, isCameraOn: boolean) => void;
}

export function useSync({ roomId, userId, onPlay, onPause, onSeek, onReaction, onMediaState }: UseSyncOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onSeekRef = useRef(onSeek);

  // Keep refs updated without triggering re-runs
  useEffect(() => {
    onPlayRef.current = onPlay;
    onPauseRef.current = onPause;
    onSeekRef.current = onSeek;
  }, [onPlay, onPause, onSeek]);

  useEffect(() => {
    if (!roomId || !userId) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || "", {
      path: "/api/socket",
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      // We pass both roomId and userId so the server can map userId to socket.id for WebRTC
      socketInstance.emit("join-room", { roomId, userId });
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("play", (payload: { userId: string; currentTime: number }) => {
      if (payload.userId === userId) return;
      onPlayRef.current(payload.currentTime, payload.userId);
    });

    socketInstance.on("pause", (payload: { userId: string; currentTime: number }) => {
      if (payload.userId === userId) return;
      onPauseRef.current(payload.currentTime, payload.userId);
    });

    socketInstance.on("seek", (payload: { userId: string; currentTime: number }) => {
      if (payload.userId === userId) return;
      onSeekRef.current(payload.currentTime, payload.userId);
    });

    socketInstance.on("kicked", (payload?: { targetUserId: string }) => {
      if (!payload || payload.targetUserId === userId) {
        socketInstance.disconnect();
        window.location.href = "/?kicked=true";
      }
    });

    socketInstance.on("reaction", (payload: { emoji: string; userId: string }) => {
      if (payload.userId === userId) return;
      onReaction?.(payload.emoji, payload.userId);
    });

    socketInstance.on("media-state", (payload: { userId: string; isMicOn: boolean; isCameraOn: boolean }) => {
      if (payload.userId === userId) return;
      onMediaState?.(payload.userId, payload.isMicOn, payload.isCameraOn);
    });

    return () => {
      socketInstance.emit("leave-room", roomId);
      socketInstance.disconnect();
    };
  }, [roomId, userId, onReaction]);

  const emitPlay = useCallback(
    (currentTime: number) => {
      socket?.emit("play", { roomId, userId, currentTime });
    },
    [socket, roomId, userId]
  );

  const emitPause = useCallback(
    (currentTime: number) => {
      socket?.emit("pause", { roomId, userId, currentTime });
    },
    [socket, roomId, userId]
  );

  const emitSeek = useCallback(
    (currentTime: number) => {
      socket?.emit("seek", { roomId, userId, currentTime });
    },
    [socket, roomId, userId]
  );

  const emitKick = useCallback(
    (targetUserId: string) => {
      socket?.emit("kick-user", { roomId, targetUserId });
    },
    [socket, roomId]
  );

  const emitReaction = useCallback(
    (emoji: string) => {
      socket?.emit("send-reaction", { roomId, emoji, userId });
      // Optimistically trigger local reaction
      onReaction?.(emoji, userId);
    },
    [socket, roomId, userId, onReaction]
  );

  const emitMediaState = useCallback(
    (isMicOn: boolean, isCameraOn: boolean) => {
      socket?.emit("media-state", { roomId, userId, isMicOn, isCameraOn });
    },
    [socket, roomId, userId]
  );

  return { isConnected, socket, emitPlay, emitPause, emitSeek, emitKick, emitReaction, emitMediaState };
}