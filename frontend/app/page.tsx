'use client';

import { useState, useEffect, useRef } from 'react';
import ConversationList from '@/components/ConversationList';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import AuthPage from '@/components/AuthPage';
import { chatApi, authApi } from '@/lib/api';
import { Conversation, Message, User } from '@/lib/types';
import { useTheme } from '@/components/ThemeProvider';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Load conversations when user is authenticated
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const authStatus = await authApi.getMe();
      if (authStatus.authenticated && authStatus.user) {
        setUser(authStatus.user);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setAuthChecked(true);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setConversations([]);
      setSelectedConversationId(null);
      setCurrentMessages([]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please use JPEG, PNG, GIF, or WebP.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updatedUser = await authApi.uploadAvatar(file);
      setUser(updatedUser);
      setError(null);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const updatedUser = await authApi.deleteAvatar();
      setUser(updatedUser);
    } catch (err) {
      console.error('Avatar delete failed:', err);
      setError('Failed to delete avatar. Please try again.');
    }
  };

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId && user) {
      loadConversation(selectedConversationId);
    } else {
      setCurrentMessages([]);
    }
  }, [selectedConversationId, user]);

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

  const handleNewConversation = async (models: string[] = ['claude-sonnet-4-5']) => {
    try {
      const newConv = await chatApi.createConversation('New Chat', models);
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
    // Get the current conversation to know how many models to expect
    const currentConversation = conversations.find(c => c.id === selectedConversationId);

    if (!selectedConversationId || !currentConversation) {
      // Create a new conversation if none is selected (use default model)
      try {
        const newConv = await chatApi.createConversation('New Chat', ['claude-sonnet-4-5']);
        setConversations([newConv, ...conversations]);
        setSelectedConversationId(newConv.id);

        // Send the message to the new conversation
        setIsLoading(true);
        const response = await chatApi.sendMessage(newConv.id, content);

        // Reload conversation to get all messages including the new ones
        await loadConversation(newConv.id);

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

      // Reload conversation to get all messages including the new ones
      await loadConversation(selectedConversationId);

      setIsLoading(false);

      // Reload conversations to update timestamps
      loadConversations();
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <span className="loading loading-spinner loading-lg text-purple-500"></span>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

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
            <h1 className="text-2xl font-bold">
              {selectedConversationId
                ? conversations.find(c => c.id === selectedConversationId)?.title || 'Multi-Chat Demo'
                : 'Multi-Chat Demo'}
            </h1>
          </div>
          <div className="flex-none gap-4 items-center">
            {isLoading && (
              <span className="loading loading-spinner loading-md"></span>
            )}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full ring ring-purple-500 ring-offset-base-100 ring-offset-1">
                  <img
                    src={user.avatar_url || '/default-avatar.svg'}
                    alt={user.username}
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
              <ul tabIndex={0} className="dropdown-content menu menu-sm bg-base-200 rounded-box z-[1] mt-3 w-64 p-2 shadow-lg">
                <li className="menu-title px-4 py-2">
                  <span className="font-semibold">{user.username}</span>
                  <span className="text-xs opacity-70">{user.email}</span>
                </li>
                <div className="divider my-1"></div>
                {/* Avatar section */}
                <li className="px-2 py-2">
                  <div className="flex items-center gap-3 w-full">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full ring ring-purple-500 ring-offset-base-100 ring-offset-1 overflow-hidden">
                        <img
                          src={user.avatar_url || '/default-avatar.svg'}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <span className="loading loading-spinner loading-sm text-white"></span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <button
                        onClick={handleAvatarClick}
                        disabled={isUploadingAvatar}
                        className="btn btn-xs btn-primary"
                      >
                        {user.avatar_url ? 'Change' : 'Upload'} photo
                      </button>
                      {user.avatar_url && (
                        <button
                          onClick={handleDeleteAvatar}
                          disabled={isUploadingAvatar}
                          className="btn btn-xs btn-ghost text-error"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </li>
                <div className="divider my-1"></div>
                <li>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-2">
                      {theme === 'light' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                      Dark mode
                    </span>
                    <input
                      type="checkbox"
                      checked={theme === 'dark'}
                      onChange={toggleTheme}
                      className="toggle toggle-sm"
                    />
                  </label>
                </li>
                <div className="divider my-1"></div>
                <li>
                  <button onClick={handleLogout} className="text-error">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {error && (
          <div className="alert alert-error text-base">
            <span>{error}</span>
          </div>
        )}
        <ChatWindow
          messages={currentMessages}
          expectedModelCount={
            selectedConversationId
              ? conversations.find(c => c.id === selectedConversationId)?.selected_models.length || 1
              : 1
          }
          user={user}
        />
        <MessageInput onSend={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
