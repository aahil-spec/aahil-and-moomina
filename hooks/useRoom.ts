import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Room, Participant } from "@/types";

const PARTICIPANT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
];

function getColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PARTICIPANT_COLORS[Math.abs(hash) % PARTICIPANT_COLORS.length];
}

export function useRoom(roomId: string, currentUserId: string, currentUserName: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !currentUserId || !currentUserName) return;

    let mounted = true;

    async function init() {
      // 1. Fetch room
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, host_id, host_name, created_at, is_active, video_url")
        .eq("id", roomId)
        .eq("is_active", true)
        .maybeSingle();

      if (!mounted) return;

      if (roomError || !roomData) {
        setError("Room not found");
        setIsLoading(false);
        return;
      }

      setRoom({
        id: roomData.id,
        hostId: roomData.host_id,
        createdAt: new Date(roomData.created_at),
        videoUrl: roomData.video_url,
      });

      // 2. Upsert self into room_members
      await supabase.from("room_members").upsert(
        {
          room_id: roomId,
          user_id: currentUserId,
          display_name: currentUserName,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "room_id,user_id" }
      );

      // 3. Load current active members
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { data: membersData } = await supabase
        .from("room_members")
        .select("*")
        .eq("room_id", roomId)
        .gte("last_seen_at", oneMinuteAgo);

      if (mounted && membersData) {
        setParticipants(
          membersData.map((m) => ({
            id: m.user_id,
            name: m.display_name,
            isHost: m.user_id === roomData.host_id,
            isMicOn: false,
            isCameraOn: false,
            color: getColor(m.user_id),
          }))
        );
      }

      if (mounted) setIsLoading(false);
    }

    init();

    // 4. Subscribe to room_members changes (presence)
    const membersChannel = supabase
      .channel(`presence:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const { data: roomData } = await supabase
            .from("rooms")
            .select("host_id")
            .eq("id", roomId)
            .single();

          const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
          const { data: membersData } = await supabase
            .from("room_members")
            .select("*")
            .eq("room_id", roomId)
            .gte("last_seen_at", oneMinuteAgo);

          if (mounted && membersData) {
            setParticipants(
              membersData.map((m) => ({
                id: m.user_id,
                name: m.display_name,
                isHost: m.user_id === (roomData?.host_id ?? ""),
                isMicOn: false,
                isCameraOn: false,
                color: getColor(m.user_id),
              }))
            );
          }
        }
      )
      .subscribe();

    // Subscribe to room updates (like video_url changing)
    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const updated = payload.new as { video_url: string | null };
          setRoom((prev) => {
            if (!prev) return prev;
            return { ...prev, videoUrl: updated.video_url };
          });
        }
      )
      .subscribe();

    // 5. Heartbeat: update last_seen every 30s
    const heartbeat = setInterval(async () => {
      await supabase
        .from("room_members")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", currentUserId);
    }, 30_000);

    return () => {
      mounted = false;
      clearInterval(heartbeat);
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, currentUserId, currentUserName]);

  const updateVideoUrl = async (newUrl: string) => {
    // Optimistic update for the person changing it
    setRoom((prev) => prev ? { ...prev, videoUrl: newUrl } : prev);

    await fetch(`/api/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl: newUrl, hostId: currentUserId }),
    });
  };

  return {
    room,
    participants,
    isHost: room?.hostId === currentUserId,
    isLoading,
    error,
    updateVideoUrl
  };
}