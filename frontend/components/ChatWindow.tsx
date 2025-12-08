'use client';

import { Message, MODEL_OPTIONS, User } from '@/lib/types';
import { useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';

interface ChatWindowProps {
  messages: Message[];
  expectedModelCount: number;  // How many models we expect responses from
  selectedModels?: string[];  // Which models are selected for this conversation
  user?: User | null;  // Current user for avatar display
  isLoading?: boolean;  // Whether a message is being sent/processed
}

export default function ChatWindow({ messages, expectedModelCount, selectedModels = [], user, isLoading = false }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
            <div className="chat-image avatar">
              <div className="w-10 h-10 rounded-full ring ring-purple-500/50 ring-offset-base-100 ring-offset-1 overflow-hidden">
                <Image
                  src={user?.avatar_url || '/default-avatar.svg'}
                  alt={user?.username || 'User'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
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

      {/* Loading indicator when sending a new message */}
      {isLoading && messages.length > 0 && (
        <div className="mb-8">
          {/* User message placeholder (already sent) */}
          <div className="chat chat-end mb-4">
            <div className="chat-image avatar">
              <div className="w-10 h-10 rounded-full ring ring-purple-500/50 ring-offset-base-100 ring-offset-1 overflow-hidden">
                <Image
                  src={user?.avatar_url || '/default-avatar.svg'}
                  alt={user?.username || 'User'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="chat-bubble text-base leading-relaxed min-h-[3rem] opacity-70">
              <p className="whitespace-pre-wrap">Sending...</p>
            </div>
          </div>

          {/* Loading responses */}
          <div className="space-y-3 ml-4">
            {Array(expectedModelCount).fill(0).map((_, i) => {
              const modelId = selectedModels[i] || '';
              const modelLabel = MODEL_OPTIONS.find(m => m.value === modelId)?.label || `Model ${i + 1}`;
              return (
                <div key={`loading-${i}`} className="card bg-base-200 shadow-md border-2 border-primary/30">
                  <div className="card-body p-4">
                    <div className="flex items-center gap-3">
                      <span className="loading loading-spinner loading-md text-primary"></span>
                      <div className="flex-1">
                        <div className="badge badge-primary badge-lg mb-2 animate-pulse">
                          {modelLabel}
                        </div>
                        <div className="space-y-2 mt-2">
                          <div className="h-4 bg-base-300 rounded w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-base-300 rounded w-1/2 animate-pulse"></div>
                        </div>
                        <p className="text-sm opacity-60 mt-3 flex items-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Generating response...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Show loading state when no messages yet */}
      {isLoading && messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <p className="text-lg opacity-70">Sending your message...</p>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
