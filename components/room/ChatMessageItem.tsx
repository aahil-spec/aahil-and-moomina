import { ChatMessage } from '@/types';

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
}

export default function ChatMessageItem({ message, isOwn }: ChatMessageItemProps) {
  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(message.timestamp);

  if (message.senderId === 'system') {
    return (
      <div className="text-center w-full my-2">
        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 w-full max-w-[85%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}>
      {!isOwn && (
        <span className="text-[11px] text-muted-foreground ml-1">
          {message.senderName} • {time}
        </span>
      )}
      <div className={`px-3 py-2 text-sm rounded-2xl ${
        isOwn 
          ? 'bg-accent text-accent-foreground rounded-tr-sm' 
          : 'bg-muted text-foreground rounded-tl-sm'
      }`}>
        {message.text}
      </div>
      {isOwn && (
        <span className="text-[10px] text-muted-foreground/60 mr-1">
          {time}
        </span>
      )}
    </div>
  );
}
