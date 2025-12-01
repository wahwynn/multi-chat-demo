'use client';

import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-300 p-4 bg-white">
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 resize-none border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
