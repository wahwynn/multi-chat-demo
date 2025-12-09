import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConversationList from '../ConversationList';
import { Conversation } from '@/lib/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ConversationList', () => {
  const mockConversations: Conversation[] = [
    {
      id: 1,
      title: 'Test Conversation',
      selected_models: ['claude-sonnet-4-5'],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  const mockProps = {
    conversations: mockConversations,
    selectedId: null,
    onSelect: jest.fn(),
    onNew: jest.fn(),
    onDelete: jest.fn(),
    onRename: jest.fn(),
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should load default models from localStorage', () => {
    const savedModels = ['claude-sonnet-4-5', 'claude-haiku-4-5'];
    localStorage.setItem('defaultSelectedModels', JSON.stringify(savedModels));

    render(<ConversationList {...mockProps} />);

    const button = screen.getByTestId('select-models-button');
    expect(button).toHaveTextContent('Claude 4.5 Sonnet, Claude 4.5 Haiku');
  });

  it('should use default model when localStorage is empty', () => {
    render(<ConversationList {...mockProps} />);

    const button = screen.getByTestId('select-models-button');
    expect(button).toHaveTextContent('Claude 4.5 Sonnet');
  });

  it('should save selected models to localStorage when changed', async () => {
    render(<ConversationList {...mockProps} />);

    // Open dropdown
    const button = screen.getByTestId('select-models-button');
    fireEvent.click(button);

    // Select additional model
    const checkbox = screen.getByTestId('model-checkbox-claude-haiku-4-5');
    fireEvent.click(checkbox);

    // Wait for state update and localStorage write
    await waitFor(() => {
      const saved = localStorage.getItem('defaultSelectedModels');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed).toContain('claude-sonnet-4-5');
      expect(parsed).toContain('claude-haiku-4-5');
    });
  });

  it('should allow multiple models to be selected', async () => {
    render(<ConversationList {...mockProps} />);

    // Open dropdown
    const button = screen.getByTestId('select-models-button');
    fireEvent.click(button);

    // Select multiple models
    fireEvent.click(screen.getByTestId('model-checkbox-claude-haiku-4-5'));
    fireEvent.click(screen.getByTestId('model-checkbox-claude-opus-4-5'));

    await waitFor(() => {
      expect(button).toHaveTextContent('Claude 4.5 Sonnet, Claude 4.5 Haiku, Claude 4.5 Opus');
    });
  });

  it('should prevent deselecting the last model', () => {
    render(<ConversationList {...mockProps} />);

    // Open dropdown
    const button = screen.getByTestId('select-models-button');
    fireEvent.click(button);

    // Try to deselect the only selected model
    const checkbox = screen.getByTestId('model-checkbox-claude-sonnet-4-5') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);

    // Should still be checked
    expect(checkbox.checked).toBe(true);
    expect(button).toHaveTextContent('Claude 4.5 Sonnet');
  });

  it('should call onNew with selected models', () => {
    const savedModels = ['claude-sonnet-4-5', 'claude-haiku-4-5'];
    localStorage.setItem('defaultSelectedModels', JSON.stringify(savedModels));

    render(<ConversationList {...mockProps} />);

    const newChatButton = screen.getByTestId('new-chat-button');
    fireEvent.click(newChatButton);

    expect(mockProps.onNew).toHaveBeenCalledWith(savedModels);
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('defaultSelectedModels', 'invalid json');

    render(<ConversationList {...mockProps} />);

    const button = screen.getByTestId('select-models-button');
    // Should fall back to default
    expect(button).toHaveTextContent('Claude 4.5 Sonnet');
  });

  it('should handle empty array in localStorage', () => {
    localStorage.setItem('defaultSelectedModels', JSON.stringify([]));

    render(<ConversationList {...mockProps} />);

    const button = screen.getByTestId('select-models-button');
    // Should fall back to default when array is empty
    expect(button).toHaveTextContent('Claude 4.5 Sonnet');
  });
});
