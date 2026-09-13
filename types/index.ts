export interface VideoState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  buffering: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isMicOn: boolean;
  isCameraOn: boolean;
  color: string;
}

export interface Room {
  id: string;
  hostId: string;
  createdAt: Date;
  videoUrl?: string | null;
}
