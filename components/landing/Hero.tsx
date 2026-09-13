import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Watch anything. <span className="text-accent">Together.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          A private room where you can watch, chat, and video call without being miles apart.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/create">
            <Button size="lg" className="w-full sm:w-auto px-8">
              Create a Room
            </Button>
          </Link>
          <Link href="/join">
            <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
              Join a Room
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
    </section>
  );
}
