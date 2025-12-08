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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-base-300 p-4 bg-base-100">
      <div className="flex gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          className="textarea textarea-bordered flex-1 resize-none text-base leading-relaxed"
          rows={3}
          disabled={disabled}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          data-testid="send-message-button"
          className="btn btn-primary px-8 text-base font-bold shadow-lg hover:shadow-xl transition-all text-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}
