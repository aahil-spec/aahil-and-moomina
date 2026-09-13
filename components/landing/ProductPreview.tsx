import { Play, MessageSquare, Video, Settings, Expand } from 'lucide-react';

export default function ProductPreview() {
  return (
    <section className="py-12 px-4 container mx-auto">
      <div className="max-w-5xl mx-auto border border-border rounded-xl overflow-hidden shadow-2xl glass animate-in fade-in duration-1000">
        
        {/* Mock App Header */}
        <div className="h-14 border-b border-border bg-card/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="px-3 py-1 bg-background rounded-md text-xs font-mono text-muted-foreground border border-border">
            room/X9K2P4
          </div>
          <div className="w-16"></div> {/* Spacer */}
        </div>

        {/* Mock App Body */}
        <div className="flex flex-col md:flex-row h-[500px]">
          {/* Main Video Area */}
          <div className="flex-1 bg-background relative flex flex-col">
            <div className="flex-1 flex items-center justify-center relative bg-black">
              {/* Fake Video */}
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent" />
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-accent/30 transition-colors">
                <Play className="w-6 h-6 text-accent ml-1" />
              </div>
            </div>
            
            {/* Fake Controls */}
            <div className="h-12 bg-card border-t border-border flex items-center px-4 gap-4 text-muted-foreground">
              <Play className="w-4 h-4" />
              <div className="h-1 flex-1 bg-border rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-accent" />
              </div>
              <span className="text-xs font-mono">12:34 / 45:00</span>
              <Settings className="w-4 h-4" />
              <Expand className="w-4 h-4" />
            </div>
          </div>

          {/* Right Sidebar Area */}
          <div className="w-full md:w-80 border-l border-border bg-card flex flex-col">
            {/* Participants */}
            <div className="p-4 border-b border-border flex gap-3 overflow-x-auto">
              <div className="w-16 h-16 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 relative">
                <span className="text-lg font-bold text-blue-500">A</span>
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center">
                  <Video className="w-2 h-2 text-green-400" />
                </div>
              </div>
              <div className="w-16 h-16 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 relative">
                <span className="text-lg font-bold text-emerald-500">B</span>
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Alice</span>
                <div className="bg-muted text-sm p-2 rounded-lg rounded-tl-none w-fit">
                  This scene is amazing! 🍿
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-xs text-muted-foreground">You</span>
                <div className="bg-accent text-accent-foreground text-sm p-2 rounded-lg rounded-tr-none w-fit">
                  I know right!
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border">
              <div className="h-9 w-full bg-background border border-border rounded-md px-3 flex items-center text-sm text-muted-foreground">
                Say something...
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
