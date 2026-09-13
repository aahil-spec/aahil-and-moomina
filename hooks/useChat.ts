import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ChatMessage } from "@/types";

export function useChat(roomId: string, currentUserId: string, currentUserName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Load initial messages
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("[useChat] load error:", error);
        return;
      }

      if (data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            senderId: m.user_id,
            senderName: m.display_name,
            text: m.text,
            timestamp: new Date(m.created_at),
          }))
        );
      }
    }

    loadMessages();

    // Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            user_id: string;
            display_name: string;
            text: string;
            created_at: string;
          };
          // Avoid duplicates (optimistic messages already added locally)
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                senderId: row.user_id,
                senderName: row.display_name,
                text: row.text,
                timestamp: new Date(row.created_at),
              },
            ];
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const id = crypto.randomUUID();
      const timestamp = new Date();

      // Optimistic update
      const optimistic: ChatMessage = {
        id,
        senderId: currentUserId,
        senderName: currentUserName,
        text: text.trim(),
        timestamp,
      };
      setMessages((prev) => [...prev, optimistic]);

      const { error } = await supabase.from("messages").insert({
        id,
        room_id: roomId,
        user_id: currentUserId,
        display_name: currentUserName,
        text: text.trim(),
        created_at: timestamp.toISOString(),
      });

      if (error) {
        console.error("[useChat] send error:", error);
        // Roll back optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    },
    [roomId, currentUserId, currentUserName]
  );

  return { messages, sendMessage, isConnected };
}