'use client';

import { Message } from '@/lib/types';
import { useEffect, useRef } from 'react';

interface ChatWindowProps {
  messages: Message[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-3xl font-bold mb-3">Welcome to Multi-Chat</h2>
          <p className="text-lg opacity-70">Start a conversation by typing a message below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`chat ${message.role === 'user' ? 'chat-end' : 'chat-start'} mb-4`}
        >
          <div className="chat-bubble text-base leading-relaxed min-h-[3rem]">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="chat-footer opacity-60 text-sm mt-1">
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
