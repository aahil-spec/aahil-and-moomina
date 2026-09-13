"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { generateRoomId } from "@/lib/roomId";

function getUserId(): string {
  const stored = localStorage.getItem("wt_user_id");
  if (stored) return stored;
  const newId = Math.random().toString(36).slice(2, 10);
  localStorage.setItem("wt_user_id", newId);
  return newId;
}

export default function CreateRoomPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;

    setLoading(true);
    setError(null);

    const roomId = generateRoomId();
    const hostId = getUserId();
    const hostName = name.trim();

    localStorage.setItem("wt_display_name", hostName);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, hostId, hostName }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to create room");
      }

      router.push(`/room/${roomId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Back nav */}
      <nav className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Film className="w-5 h-5 text-accent" />
            <span className="font-bold">Aahil and Moomina</span>
          </div>

          <h1 className="text-2xl font-bold mb-2">Create your room</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Enter your name to host a new watch party.
          </p>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aahil"
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
                required
                minLength={2}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="mt-2" disabled={loading || name.trim().length < 2}>
              {loading ? "Creating room..." : "Create Room"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}