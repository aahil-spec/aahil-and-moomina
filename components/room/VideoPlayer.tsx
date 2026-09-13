"use client";

import {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { VideoState } from "@/types";
import VideoControls from "./VideoControls";

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getState: () => VideoState;
}

interface VideoPlayerProps {
  roomId: string;
  videoUrl?: string | null;
  onPlay?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onSeek?: (currentTime: number) => void;
}

const DEFAULT_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

// Extract YouTube video ID from various URL formats
function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

// ──────────────────────────────────────────────
// HTML5 Video Player (for MP4 and direct URLs)
// ──────────────────────────────────────────────
const Html5Player = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ roomId, videoUrl, onPlay, onPause, onSeek }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isRemoteAction = useRef(false);

    const [state, setState] = useState<VideoState>({
      playing: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      muted: false,
      buffering: false,
    });

    const resolvedUrl = videoUrl || DEFAULT_VIDEO;

    useEffect(() => {
      const v = videoRef.current;
      if (!v) return;

      const handlePlay = () => {
        setState((s) => ({ ...s, playing: true }));
        if (!isRemoteAction.current) onPlay?.(v.currentTime);
        isRemoteAction.current = false;
      };
      const handlePause = () => {
        setState((s) => ({ ...s, playing: false }));
        if (!isRemoteAction.current) onPause?.(v.currentTime);
        isRemoteAction.current = false;
      };
      const handleTimeUpdate = () =>
        setState((s) => ({ ...s, currentTime: v.currentTime }));
      const handleDuration = () =>
        setState((s) => ({ ...s, duration: v.duration || 0 }));
      const handleWaiting = () =>
        setState((s) => ({ ...s, buffering: true }));
      const handlePlaying = () =>
        setState((s) => ({ ...s, buffering: false }));

      v.addEventListener("play", handlePlay);
      v.addEventListener("pause", handlePause);
      v.addEventListener("timeupdate", handleTimeUpdate);
      v.addEventListener("durationchange", handleDuration);
      v.addEventListener("waiting", handleWaiting);
      v.addEventListener("playing", handlePlaying);

      return () => {
        v.removeEventListener("play", handlePlay);
        v.removeEventListener("pause", handlePause);
        v.removeEventListener("timeupdate", handleTimeUpdate);
        v.removeEventListener("durationchange", handleDuration);
        v.removeEventListener("waiting", handleWaiting);
        v.removeEventListener("playing", handlePlaying);
      };
    }, [onPlay, onPause, resolvedUrl]);

    useImperativeHandle(ref, () => ({
      play: () => {
        isRemoteAction.current = true;
        videoRef.current?.play();
      },
      pause: () => {
        isRemoteAction.current = true;
        videoRef.current?.pause();
      },
      seek: (time: number) => {
        isRemoteAction.current = true;
        if (videoRef.current) videoRef.current.currentTime = time;
      },
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      getState: () => state,
    }));

    const toggleFullscreen = () => {
      if (!document.fullscreenElement)
        containerRef.current?.requestFullscreen();
      else document.exitFullscreen();
    };

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex flex-col bg-black group"
      >
        <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
          <video
            ref={videoRef}
            key={resolvedUrl}
            src={resolvedUrl}
            className="w-full h-full object-contain"
            playsInline
            preload="metadata"
          />
        </div>
        <div className="h-12 bg-card border-t border-border flex-shrink-0">
          <VideoControls
            state={state}
            onPlay={() => videoRef.current?.play()}
            onPause={() => videoRef.current?.pause()}
            onSeek={(t) => {
              if (videoRef.current) {
                videoRef.current.currentTime = t;
                onSeek?.(t);
              }
            }}
            onVolumeChange={(v) => {
              if (videoRef.current) videoRef.current.volume = v;
              setState((s) => ({ ...s, volume: v }));
            }}
            onMute={() => {
              if (videoRef.current)
                videoRef.current.muted = !videoRef.current.muted;
              setState((s) => ({ ...s, muted: !s.muted }));
            }}
            onFullscreen={toggleFullscreen}
          />
        </div>
      </div>
    );
  }
);
Html5Player.displayName = "Html5Player";

// ──────────────────────────────────────────────
// YouTube Player (using YouTube IFrame API)
// ──────────────────────────────────────────────

// Extend the global Window to include YT types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

// Load the YouTube IFrame API script once
let ytApiLoaded = false;
let ytApiReady = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiReady) {
      resolve();
      return;
    }

    ytApiCallbacks.push(resolve);

    if (!ytApiLoaded) {
      ytApiLoaded = true;
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        ytApiCallbacks.forEach((cb) => cb());
        ytApiCallbacks.length = 0;
      };
    }
  });
}

const YouTubePlayer = forwardRef<
  VideoPlayerHandle,
  VideoPlayerProps & { youtubeId: string }
>(({ roomId, youtubeId, onPlay, onPause, onSeek }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const isRemoteAction = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const [state, setState] = useState<VideoState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    muted: false,
    buffering: false,
  });

  // Store callbacks in refs so they don't cause re-initialization
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  onPlayRef.current = onPlay;
  onPauseRef.current = onPause;

  useEffect(() => {
    let destroyed = false;
    const divId = `yt-player-${roomId}-${Date.now()}`;

    // Create a fresh div for the player
    if (playerDivRef.current) {
      playerDivRef.current.innerHTML = "";
      const el = document.createElement("div");
      el.id = divId;
      playerDivRef.current.appendChild(el);
    }

    loadYouTubeApi().then(() => {
      if (destroyed || !playerDivRef.current) return;

      const player = new window.YT.Player(divId, {
        videoId: youtubeId,
        width: "100%",
        height: "100%",
        playerVars: {
          modestbranding: 1,
          rel: 0,
          autoplay: 0,
          controls: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            const dur = player.getDuration?.() ?? 0;
            setState((s) => ({ ...s, duration: dur }));
          },
          onStateChange: (event: any) => {
            if (destroyed) return;
            const YT_PLAYING = 1;
            const YT_PAUSED = 2;
            const YT_BUFFERING = 3;

            if (event.data === YT_PLAYING) {
              setState((s) => ({
                ...s,
                playing: true,
                buffering: false,
                duration: player.getDuration?.() ?? s.duration,
              }));
              if (!isRemoteAction.current) {
                onPlayRef.current?.(player.getCurrentTime?.() ?? 0);
              }
              isRemoteAction.current = false;
            } else if (event.data === YT_PAUSED) {
              setState((s) => ({ ...s, playing: false }));
              if (!isRemoteAction.current) {
                onPauseRef.current?.(player.getCurrentTime?.() ?? 0);
              }
              isRemoteAction.current = false;
            } else if (event.data === YT_BUFFERING) {
              setState((s) => ({ ...s, buffering: true }));
            }
          },
        },
      });

      ytPlayerRef.current = player;

      // Poll current time every 500ms for the progress bar
      intervalRef.current = setInterval(() => {
        if (ytPlayerRef.current?.getCurrentTime) {
          const t = ytPlayerRef.current.getCurrentTime();
          setState((s) => ({ ...s, currentTime: t }));
        }
      }, 500);
    });

    return () => {
      destroyed = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          // ignore
        }
      }
      ytPlayerRef.current = null;
    };
  }, [youtubeId, roomId]);

  useImperativeHandle(ref, () => ({
    play: () => {
      isRemoteAction.current = true;
      ytPlayerRef.current?.playVideo?.();
    },
    pause: () => {
      isRemoteAction.current = true;
      ytPlayerRef.current?.pauseVideo?.();
    },
    seek: (time: number) => {
      isRemoteAction.current = true;
      ytPlayerRef.current?.seekTo?.(time, true);
    },
    getCurrentTime: () => ytPlayerRef.current?.getCurrentTime?.() ?? 0,
    getState: () => state,
  }));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement)
      containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-black group"
    >
      <div
        ref={playerDivRef}
        className="flex-1 min-h-0 overflow-hidden"
        style={{ minHeight: "200px" }}
      />
      <div className="h-12 bg-card border-t border-border flex-shrink-0">
        <VideoControls
          state={state}
          onPlay={() => ytPlayerRef.current?.playVideo?.()}
          onPause={() => ytPlayerRef.current?.pauseVideo?.()}
          onSeek={(t) => {
            ytPlayerRef.current?.seekTo?.(t, true);
            onSeek?.(t);
          }}
          onVolumeChange={(v) => {
            ytPlayerRef.current?.setVolume?.(v * 100);
            setState((s) => ({ ...s, volume: v }));
          }}
          onMute={() => {
            if (ytPlayerRef.current) {
              if (state.muted) ytPlayerRef.current.unMute?.();
              else ytPlayerRef.current.mute?.();
            }
            setState((s) => ({ ...s, muted: !s.muted }));
          }}
          onFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
});
YouTubePlayer.displayName = "YouTubePlayer";

// ──────────────────────────────────────────────
// Main VideoPlayer — routes to the right player
// ──────────────────────────────────────────────
const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  (props, ref) => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    if (!isClient) return null;

    const resolvedUrl = props.videoUrl || DEFAULT_VIDEO;
    const ytId = getYouTubeId(resolvedUrl);

    if (ytId) {
      return <YouTubePlayer ref={ref} {...props} youtubeId={ytId} />;
    }
    return <Html5Player ref={ref} {...props} />;
  }
);

VideoPlayer.displayName = "VideoPlayer";
export default VideoPlayer;