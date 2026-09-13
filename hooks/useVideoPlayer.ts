import { useState, useEffect, RefObject, useCallback } from 'react';
import { VideoState } from '@/types';

export function useVideoPlayer(videoRef: RefObject<HTMLVideoElement>) {
  const [state, setState] = useState<VideoState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    muted: false,
    buffering: false,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setState((s) => ({ ...s, playing: true }));
    const handlePause = () => setState((s) => ({ ...s, playing: false }));
    const handleTimeUpdate = () => setState((s) => ({ ...s, currentTime: video.currentTime }));
    const handleDurationChange = () => setState((s) => ({ ...s, duration: video.duration }));
    const handleVolumeChange = () => setState((s) => ({ ...s, volume: video.volume, muted: video.muted }));
    const handleWaiting = () => setState((s) => ({ ...s, buffering: true }));
    const handlePlaying = () => setState((s) => ({ ...s, buffering: false }));

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [videoRef]);

  const play = useCallback(() => videoRef.current?.play(), [videoRef]);
  const pause = useCallback(() => videoRef.current?.pause(), [videoRef]);
  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, [videoRef]);
  
  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, [videoRef]);

  const toggleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  }, [videoRef]);

  return { state, play, pause, seek, setVolume, toggleMute, toggleFullscreen };
}
