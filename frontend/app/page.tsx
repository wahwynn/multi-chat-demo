'use client';

import { useState, useEffect } from 'react';
import ConversationList from '@/components/ConversationList';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import { chatApi } from '@/lib/api';
import { Conversation, Message } from '@/lib/types';
import { useTheme } from '@/components/ThemeProvider';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadConversation(selectedConversationId);
    } else {
      setCurrentMessages([]);
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      const data = await chatApi.getConversation(id);
      setCurrentMessages(data.messages || []);
    } catch (err) {
      setError('Failed to load conversation');
      console.error(err);
    }
  };

  const handleNewConversation = async (model: string = 'claude-sonnet-4-5') => {
    try {
      const newConv = await chatApi.createConversation('New Chat', model);
      setConversations([newConv, ...conversations]);
      setSelectedConversationId(newConv.id);
    } catch (err) {
      setError('Failed to create conversation');
      console.error(err);
    }
  };

  const handleSelectConversation = (id: number) => {
    setSelectedConversationId(id);
  };

  const handleRenameConversation = async (id: number, newTitle: string) => {
    try {
      const updatedConv = await chatApi.updateConversation(id, newTitle);
      setConversations(conversations.map((c) => (c.id === id ? { ...c, title: updatedConv.title } : c)));
    } catch (err) {
      setError('Failed to rename conversation');
      console.error(err);
    }
  };

  const handleDeleteConversation = async (id: number) => {
    try {
      await chatApi.deleteConversation(id);
      setConversations(conversations.filter((c) => c.id !== id));
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
      }
    } catch (err) {
      setError('Failed to delete conversation');
      console.error(err);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) {
      // Create a new conversation if none is selected (use default model)
      try {
        const newConv = await chatApi.createConversation('New Chat', 'claude-sonnet-4-5');
        setConversations([newConv, ...conversations]);
        setSelectedConversationId(newConv.id);

        // Send the message to the new conversation
        setIsLoading(true);
        const response = await chatApi.sendMessage(newConv.id, content);
        setCurrentMessages([response.message, response.assistant_message]);
        setIsLoading(false);

        // Reload conversations to update the list
        loadConversations();
      } catch (err) {
        setError('Failed to send message');
        console.error(err);
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      const response = await chatApi.sendMessage(selectedConversationId, content);
      setCurrentMessages([...currentMessages, response.message, response.assistant_message]);
      setIsLoading(false);

      // Reload conversations to update timestamps
      loadConversations();
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-base-100">
      <ConversationList
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
      />
      <div className="flex-1 flex flex-col">
        <div className="navbar bg-base-300 shadow-md px-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Multi-Chat Demo</h1>
          </div>
          <div className="flex-none gap-2">
            {isLoading && (
              <span className="loading loading-spinner loading-md"></span>
            )}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-circle"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {error && (
          <div className="alert alert-error text-base">
            <span>{error}</span>
          </div>
        )}
        <ChatWindow messages={currentMessages} />
        <MessageInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
