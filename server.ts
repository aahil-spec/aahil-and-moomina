import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

export interface SyncPayload {
  roomId: string;
  userId: string;
  currentTime: number;
}

interface WebRTCSignal {
  roomId: string;
  fromUserId: string;
  toUserId: string;
  data: unknown;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  // Map userId → socketId for WebRTC targeting
  const userSocketMap = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log("[socket.io] connected:", socket.id);

    // ── Room sync ──────────────────────────────────────────
    socket.on("join-room", ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.join(roomId);
      userSocketMap.set(userId, socket.id);
      console.log(`[socket.io] ${userId} (${socket.id}) joined room ${roomId}`);

      // Tell everyone else in the room that a new peer arrived
      socket.to(roomId).emit("peer-joined", { userId });
    });

    socket.on("play", (payload: SyncPayload) => {
      socket.to(payload.roomId).emit("play", payload);
    });

    socket.on("pause", (payload: SyncPayload) => {
      socket.to(payload.roomId).emit("pause", payload);
    });

    socket.on("seek", (payload: SyncPayload) => {
      socket.to(payload.roomId).emit("seek", payload);
    });

    socket.on("leave-room", (roomId: string) => {
      socket.leave(roomId);
    });

    // ── WebRTC Signaling ───────────────────────────────────
    // Offer: caller → callee
    socket.on("webrtc-offer", (signal: WebRTCSignal) => {
      const targetSocketId = userSocketMap.get(signal.toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-offer", signal);
      }
    });

    // Answer: callee → caller
    socket.on("webrtc-answer", (signal: WebRTCSignal) => {
      const targetSocketId = userSocketMap.get(signal.toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-answer", signal);
      }
    });

    // ICE candidates: both directions
    socket.on("webrtc-ice-candidate", (signal: WebRTCSignal) => {
      const targetSocketId = userSocketMap.get(signal.toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("webrtc-ice-candidate", signal);
      }
    });

    socket.on("webrtc-ready", ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.to(roomId).emit("webrtc-ready", { userId });
    });

    socket.on("kick-user", ({ roomId, targetUserId }: { roomId: string; targetUserId: string }) => {
      // Broadcast to the whole room, clients will check if they are the target
      io.to(roomId).emit("kicked", { targetUserId });
    });

    socket.on("send-reaction", ({ roomId, emoji, userId }: { roomId: string; emoji: string; userId: string }) => {
      io.to(roomId).emit("reaction", { emoji, userId });
    });

    socket.on("disconnect", () => {
      console.log("[socket.io] disconnected:", socket.id);
      // Clean up userId -> socketId mapping
      let userIdToRemove: string | null = null;
      userSocketMap.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          userIdToRemove = userId;
        }
      });
      if (userIdToRemove) {
        userSocketMap.delete(userIdToRemove);
      }
    });
  });

  const port = parseInt(process.env.PORT ?? "3000", 10);
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
