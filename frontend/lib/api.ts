import axios from 'axios';
import { Conversation, ChatResponse, User, AuthStatus } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Auth API
export const authApi = {
  // Get current user
  getMe: async (): Promise<AuthStatus> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Login
  login: async (username: string, password: string): Promise<User> => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  // Register
  register: async (username: string, email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete avatar
  deleteAvatar: async (): Promise<User> => {
    const response = await api.delete('/auth/avatar');
    return response.data;
  },

  // Update profile (username and/or email)
  updateProfile: async (username?: string, email?: string): Promise<User> => {
    const response = await api.patch('/auth/profile', { username, email });
    return response.data;
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
  },
};

export const chatApi = {
  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  // Create a new conversation with multiple models
  createConversation: async (title: string = 'New Chat', selected_models: string[] = ['claude-3-5-sonnet-20241022']): Promise<Conversation> => {
    const response = await api.post('/chat/conversations', { title, selected_models });
    return response.data;
  },

  // Get a specific conversation with messages
  getConversation: async (conversationId: number): Promise<Conversation> => {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  // Update conversation title
  updateConversation: async (conversationId: number, title: string): Promise<Conversation> => {
    const response = await api.patch(`/chat/conversations/${conversationId}`, { title });
    return response.data;
  },

  // Delete a conversation
  deleteConversation: async (conversationId: number): Promise<void> => {
    await api.delete(`/chat/conversations/${conversationId}`);
  },

  // Send a message and get a response
  sendMessage: async (conversationId: number, content: string): Promise<ChatResponse> => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data;
  },
};
