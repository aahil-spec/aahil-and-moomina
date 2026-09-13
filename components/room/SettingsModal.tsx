"use client";

import { useState, useEffect } from "react";
import { X, Settings, Mic, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Device {
  deviceId: string;
  label: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMic: string;
  selectedCam: string;
  onSelectMic: (id: string) => void;
  onSelectCam: (id: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  selectedMic,
  selectedCam,
  onSelectMic,
  onSelectCam,
}: SettingsModalProps) {
  const [mics, setMics] = useState<Device[]>([]);
  const [cams, setCams] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    async function loadDevices() {
      setIsLoading(true);
      setError(null);
      try {
        // Must request permissions first to get device labels
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        if (!mounted) return;

        const audioInputs = devices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label || "Unknown Microphone" }));
          
        const videoInputs = devices
          .filter((d) => d.kind === "videoinput")
          .map((d) => ({ deviceId: d.deviceId, label: d.label || "Unknown Camera" }));

        // Deduplicate
        const uniqueMics = Array.from(new Map(audioInputs.map(item => [item.deviceId, item])).values());
        const uniqueCams = Array.from(new Map(videoInputs.map(item => [item.deviceId, item])).values());

        setMics(uniqueMics);
        setCams(uniqueCams);

        if (uniqueMics.length > 0 && !selectedMic) onSelectMic(uniqueMics[0].deviceId);
        if (uniqueCams.length > 0 && !selectedCam) onSelectCam(uniqueCams[0].deviceId);

      } catch (err) {
        if (!mounted) return;
        setError("Could not access devices. Please allow permissions.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadDevices();

    return () => {
      mounted = false;
    };
  }, [isOpen, selectedMic, selectedCam, onSelectMic, onSelectCam]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card p-6 rounded-xl border border-border w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 mb-6 text-xl font-bold">
          <Settings className="w-5 h-5 text-accent" />
          <h2>Device Settings</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Scanning devices...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-md border border-red-500/20 text-sm mb-4">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Video className="w-4 h-4" /> Camera
              </label>
              <select
                value={selectedCam}
                onChange={(e) => onSelectCam(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {cams.length === 0 && <option value="">No cameras found</option>}
                {cams.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Mic className="w-4 h-4" /> Microphone
              </label>
              <select
                value={selectedMic}
                onChange={(e) => onSelectMic(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {mics.length === 0 && <option value="">No microphones found</option>}
                {mics.map((mic) => (
                  <option key={mic.deviceId} value={mic.deviceId}>
                    {mic.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <Button onClick={onClose} variant="default">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
