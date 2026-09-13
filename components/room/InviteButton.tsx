"use client";

import { useState } from 'react';
import { Link, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InviteButton({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button 
      variant={copied ? "outline" : "default"} 
      size="sm" 
      onClick={handleCopy}
      className={`gap-2 ${copied ? "border-green-500 text-green-500 hover:text-green-500 hover:bg-green-500/10" : ""}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
      <span className="hidden sm:inline">{copied ? "Copied!" : "Invite"}</span>
    </Button>
  );
}
