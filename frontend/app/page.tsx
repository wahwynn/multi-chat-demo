'use client';

import { useState, useEffect } from 'react';
import ConversationList from '@/components/ConversationList';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import { chatApi } from '@/lib/api';
import { Conversation, Message } from '@/lib/types';

export default function Home() {
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
        <div className="navbar bg-base-300 shadow-md">
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Multi-Chat Demo</h1>
          </div>
          {isLoading && (
            <div className="flex-none">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          )}
        </div>
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        <ChatWindow messages={currentMessages} />
        <MessageInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
