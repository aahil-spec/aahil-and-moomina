"use client";

import { forwardRef, useImperativeHandle, useState, useEffect } from "react";

export interface ReactionOverlayHandle {
  addReaction: (emoji: string) => void;
}

interface Reaction {
  id: string;
  emoji: string;
  left: number;
}

const ReactionOverlay = forwardRef<ReactionOverlayHandle>((props, ref) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useImperativeHandle(ref, () => ({
    addReaction: (emoji: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      // Random horizontal position between 10% and 90%
      const left = 10 + Math.random() * 80;
      
      setReactions((prev) => [...prev, { id, emoji, left }]);

      // Remove after animation completes (2s)
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2000);
    },
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-0 text-4xl animate-float-up"
          style={{ left: `${r.left}%` }}
        >
          {r.emoji}
        </div>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-up {
          0% { transform: translateY(100px) scale(0.5); opacity: 0; }
          20% { transform: translateY(0) scale(1.2); opacity: 1; }
          100% { transform: translateY(-200px) scale(1); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
      `}} />
    </div>
  );
});

ReactionOverlay.displayName = "ReactionOverlay";
export default ReactionOverlay;
