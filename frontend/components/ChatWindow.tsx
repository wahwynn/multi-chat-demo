'use client';

import { Message, MODEL_OPTIONS, User } from '@/lib/types';
import { useEffect, useRef, useMemo } from 'react';

interface ChatWindowProps {
  messages: Message[];
  expectedModelCount: number;  // How many models we expect responses from
  user?: User | null;  // Current user for avatar display
}

export default function ChatWindow({ messages, expectedModelCount, user }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Group messages by user message and their responses
  const groupedMessages = useMemo(() => {
    const groups: Array<{ user: Message; responses: Message[] }> = [];
    const userMessages = messages.filter(m => m.role === 'user');

    for (const userMsg of userMessages) {
      const responses = messages.filter(
        m => m.role === 'assistant' && m.parent_message_id === userMsg.id
      );
      groups.push({ user: userMsg, responses });
    }

    return groups;
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
      {groupedMessages.map((group) => (
        <div key={group.user.id} className="mb-8">
          {/* User message */}
          <div className="chat chat-end mb-4">
            <div className="chat-image avatar placeholder">
              {user?.avatar_url ? (
                <div className="w-10 h-10 rounded-full ring ring-purple-500/50 ring-offset-base-100 ring-offset-1 overflow-hidden">
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="chat-bubble text-base leading-relaxed min-h-[3rem]">
              <p className="whitespace-pre-wrap">{group.user.content}</p>
            </div>
            <div className="chat-footer opacity-60 text-sm mt-1">
              {new Date(group.user.created_at).toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>

          {/* Assistant responses - stacked cards */}
          <div className="space-y-3 ml-4">
            {/* Actual responses */}
            {group.responses.map((response) => (
              <div key={response.id} className="card bg-base-200 shadow-md">
                <div className="card-body p-4">
                  <div className="badge badge-primary mb-2">
                    {MODEL_OPTIONS.find(m => m.value === response.model)?.label || response.model}
                  </div>
                  <p className="whitespace-pre-wrap text-base leading-relaxed">{response.content}</p>
                  <div className="text-sm opacity-60 mt-2">
                    {new Date(response.created_at).toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading placeholders for pending responses */}
            {Array(Math.max(0, expectedModelCount - group.responses.length)).fill(0).map((_, i) => (
              <div key={`loading-${i}`} className="card bg-base-200 shadow-md animate-pulse">
                <div className="card-body p-4 flex items-center justify-center min-h-[100px]">
                  <span className="loading loading-spinner loading-lg"></span>
                  <p className="text-sm opacity-60 mt-2">Waiting for response...</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
