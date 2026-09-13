"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Socket } from "socket.io-client";

export interface RemoteStream {
  userId: string;
  stream: MediaStream;
}

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  socket: Socket | null;
  enabled: boolean; 
  participants: { id: string }[]; // Pass in participants to know who to call
  audioDeviceId?: string;
  videoDeviceId?: string;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC({ roomId, userId, socket, enabled, participants, audioDeviceId, videoDeviceId }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const addRemoteStream = useCallback((peerId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => {
      if (prev.find((r) => r.userId === peerId)) {
        return prev.map((r) => (r.userId === peerId ? { userId: peerId, stream } : r));
      }
      return [...prev, { userId: peerId, stream }];
    });
  }, []);

  const removeRemoteStream = useCallback((peerId: string) => {
    setRemoteStreams((prev) => prev.filter((r) => r.userId !== peerId));
  }, []);

  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    // Clean up existing connection if it exists
    if (peersRef.current.has(peerId)) {
      peersRef.current.get(peerId)?.close();
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        addRemoteStream(peerId, event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("webrtc-ice-candidate", {
          roomId,
          fromUserId: userId,
          toUserId: peerId,
          data: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        removeRemoteStream(peerId);
        peersRef.current.delete(peerId);
      }
    };

    peersRef.current.set(peerId, pc);
    return pc;
  }, [socket, roomId, userId, addRemoteStream, removeRemoteStream]);

  const callPeer = useCallback(async (peerId: string) => {
    if (!socket) return;
    const pc = createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("webrtc-offer", { roomId, fromUserId: userId, toUserId: peerId, data: offer });
  }, [socket, roomId, userId, createPeerConnection]);

  // Socket signaling
  useEffect(() => {
    if (!socket) return;

    // When someone announces they are ready, we call them IF we have a stream and our ID is smaller
    // (This avoids both sides sending offers simultaneously)
    const onWebRTCReady = ({ userId: peerId }: { userId: string }) => {
      if (peerId === userId) return;
      if (localStreamRef.current && userId < peerId) {
        callPeer(peerId);
      } else if (!localStreamRef.current) {
        // If we don't have a camera enabled, we still want to see them.
        // But we wait for THEM to call us, which they will do because their ID > our ID? 
        // No, if they have stream and we don't, they should ALWAYS call us.
        // Actually, if we just let the person who emitted 'webrtc-ready' call everyone, it's easier.
      }
    };

    const onOffer = async ({ fromUserId: peerId, data: offer }: any) => {
      const pc = createPeerConnection(peerId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { roomId, fromUserId: userId, toUserId: peerId, data: answer });
    };

    const onAnswer = async ({ fromUserId: peerId, data: answer }: any) => {
      const pc = peersRef.current.get(peerId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIceCandidate = async ({ fromUserId: peerId, data: candidate }: any) => {
      const pc = peersRef.current.get(peerId);
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket.on("webrtc-ready", onWebRTCReady);
    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("webrtc-ice-candidate", onIceCandidate);

    return () => {
      socket.off("webrtc-ready", onWebRTCReady);
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("webrtc-ice-candidate", onIceCandidate);
    };
  }, [socket, roomId, userId, callPeer, createPeerConnection]);

  // Handle acquiring stream
  useEffect(() => {
    if (!enabled) return;
    let stream: MediaStream;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
          audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        });

        // If replacing an existing stream, we must replace tracks on all peer connections
        if (localStreamRef.current) {
          const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
          const newVideoTrack = stream.getVideoTracks()[0];
          const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
          const newAudioTrack = stream.getAudioTracks()[0];

          peersRef.current.forEach((pc) => {
            const senders = pc.getSenders();
            const videoSender = senders.find(s => s.track?.kind === "video");
            const audioSender = senders.find(s => s.track?.kind === "audio");
            
            if (videoSender && newVideoTrack) videoSender.replaceTrack(newVideoTrack);
            if (audioSender && newAudioTrack) audioSender.replaceTrack(newAudioTrack);
          });
          
          oldVideoTrack?.stop();
          oldAudioTrack?.stop();
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setError(null);

        // When we get our stream, we call everyone else in the room
        participants.forEach((p) => {
          if (p.id !== userId) callPeer(p.id);
        });

      } catch (err: any) {
        setError(err.message || "Camera/mic permission denied");
      }
    })();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStreams([]);
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
  }, [enabled, audioDeviceId, videoDeviceId]); // Re-run when devices change or enabled toggles

  // Listen for NEW participants joining and call them if we have a stream
  useEffect(() => {
    if (!socket || !localStreamRef.current) return;
    const onPeerJoined = ({ userId: peerId }: { userId: string }) => {
      if (peerId !== userId) callPeer(peerId);
    };
    socket.on("peer-joined", onPeerJoined);
    return () => { socket.off("peer-joined", onPeerJoined); };
  }, [socket, userId, callPeer]);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMicOn(track.enabled); }
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCameraOn(track.enabled); }
  }, []);

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

  const toggleScreenShare = useCallback(async () => {
    if (!localStreamRef.current) return;

    if (isScreenSharing) {
      // Revert to camera
      const screenTrack = localStreamRef.current.getVideoTracks()[0];
      screenTrack.stop();
      
      if (originalVideoTrackRef.current) {
        localStreamRef.current.removeTrack(screenTrack);
        localStreamRef.current.addTrack(originalVideoTrackRef.current);
        
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(originalVideoTrackRef.current);
        });
        
        setIsScreenSharing(false);
      }
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        
        originalVideoTrackRef.current = localStreamRef.current.getVideoTracks()[0];
        
        localStreamRef.current.removeTrack(originalVideoTrackRef.current);
        localStreamRef.current.addTrack(screenTrack);
        
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        
        screenTrack.onended = () => {
          // Trigger revert manually when browser's native "Stop sharing" is clicked
          setIsScreenSharing(false);
          if (originalVideoTrackRef.current && localStreamRef.current) {
            localStreamRef.current.removeTrack(screenTrack);
            localStreamRef.current.addTrack(originalVideoTrackRef.current);
            peersRef.current.forEach(pc => {
              const sender = pc.getSenders().find(s => s.track?.kind === 'video');
              if (sender) sender.replaceTrack(originalVideoTrackRef.current);
            });
          }
        };
        
        setIsScreenSharing(true);
      } catch (err) {
        console.warn("Screen share cancelled", err);
      }
    }
  }, [isScreenSharing]);

  return { localStream, remoteStreams, isMicOn, isCameraOn, isScreenSharing, toggleMic, toggleCamera, toggleScreenShare, error };
}
