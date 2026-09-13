"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function JoinRoomPage() {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 2 || roomCode.length < 6) return;
    
    localStorage.setItem('wt_display_name', name);
    router.push(`/room/${roomCode.toUpperCase()}`);
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 md:p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Join a room</h1>
        <p className="text-muted-foreground mb-6">Enter the room code and your name to join the party.</p>
        
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium">Display Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bob"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              minLength={2}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label htmlFor="roomCode" className="text-sm font-medium">Room Code</label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. X9K2P4"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 uppercase"
              required
              minLength={6}
              maxLength={6}
            />
          </div>
          
          <Button type="submit" size="lg" className="mt-2" disabled={name.length < 2 || roomCode.length < 6}>
            Join Room
          </Button>
        </form>
      </div>
    </main>
  );
}
