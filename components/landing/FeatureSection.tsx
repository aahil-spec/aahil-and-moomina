import { Play, MessageSquare, Video, Lock } from 'lucide-react';

export default function FeatureSection() {
  const features = [
    {
      icon: <Play className="w-6 h-6 text-accent" />,
      title: "Watch in Sync",
      description: "Keep playback synchronized perfectly across all participants."
    },
    {
      icon: <Video className="w-6 h-6 text-accent" />,
      title: "Talk Face to Face",
      description: "Jump on a video call while watching without leaving the app."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-accent" />,
      title: "Chat Naturally",
      description: "Send messages, share reactions, and chat in real-time."
    },
    {
      icon: <Lock className="w-6 h-6 text-accent" />,
      title: "Private Rooms",
      description: "Create a secure room and share the link only with your friends."
    }
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-accent/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
