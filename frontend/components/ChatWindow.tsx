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
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Welcome to Multi-Chat</h2>
          <p>Start a conversation by typing a message below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] rounded-lg p-4 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs mt-2 opacity-70">
              {new Date(message.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
