"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import ChatMessageItem from './ChatMessageItem';
import { Button } from '@/components/ui/button';

interface ChatPanelProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  onSendReaction?: (emoji: string) => void;
}

const EMOJIS = ["😂", "❤️", "😮", "👏", "🔥", "😭"];

export default function ChatPanel({ roomId, currentUserId, currentUserName, onSendReaction }: ChatPanelProps) {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const { messages, sendMessage } = useChat(roomId, currentUserId, currentUserName);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
    setShowEmojis(false);
  };

  return (
    <div className="flex flex-col h-full bg-card relative">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-20" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            No messages yet. Say hi! 👋
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem 
              key={msg.id} 
              message={msg} 
              isOwn={msg.senderId === currentUserId} 
            />
          ))
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-background/95 backdrop-blur-md flex flex-col gap-2">
        {showEmojis && (
          <div className="flex gap-3 px-1 overflow-x-auto scrollbar-hide shrink-0 pb-1">
            {EMOJIS.map(emoji => (
              <button 
                key={emoji}
                type="button"
                onClick={() => {
                  onSendReaction?.(emoji);
                  setShowEmojis(false);
                }}
                className="text-lg hover:scale-125 transition-transform cursor-pointer shrink-0"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Say something..."
            className="flex-1 h-10 bg-background border border-border rounded-md px-3 text-sm focus-visible:outline-none focus-visible:border-accent"
          />
          <Button 
            type="button" 
            variant="secondary" 
            size="icon" 
            onClick={() => setShowEmojis(!showEmojis)}
          >
            <Smile className="w-4 h-4" />
          </Button>
          <Button type="submit" size="icon" disabled={!text.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
