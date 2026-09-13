import Link from 'next/link';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Film className="w-6 h-6 text-accent" />
          <span className="font-bold text-lg tracking-tight">Aahil and Moomina</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/join">
            <Button variant="ghost">Join Room</Button>
          </Link>
          <Link href="/create">
            <Button>Create Room</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
