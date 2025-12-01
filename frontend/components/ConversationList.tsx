'use client';

import { Conversation, MODEL_OPTIONS } from '@/lib/types';
import { useState } from 'react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: (model: string) => void;
  onDelete: (id: number) => void;
  onRename: (id: number, newTitle: string) => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5');

  const handleStartEdit = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (id: number) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="w-64 bg-base-200 flex flex-col h-full">
      <div className="p-4 border-b border-base-300">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="select select-bordered w-full mb-2"
        >
          {MODEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => onNew(selectedModel)}
          className="btn btn-primary w-full"
        >
          + New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`p-4 cursor-pointer hover:bg-base-300 border-b border-base-300 flex justify-between items-center ${
              selectedId === conv.id ? 'bg-base-300' : ''
            }`}
            onClick={() => editingId !== conv.id && onSelect(conv.id)}
          >
            <div className="flex-1 truncate">
              {editingId === conv.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, conv.id)}
                  onBlur={() => handleSaveEdit(conv.id)}
                  className="input input-bordered input-sm w-full"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <h3
                    className="font-semibold truncate cursor-text hover:text-primary transition-colors"
                    onDoubleClick={(e) => handleStartEdit(conv, e)}
                  >
                    {conv.title}
                  </h3>
                  <p className="text-xs opacity-60">
                    {MODEL_OPTIONS.find(m => m.value === conv.model)?.label || conv.model}
                  </p>
                  <p className="text-xs opacity-50">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
            <div className="ml-2 flex gap-1">
              {editingId !== conv.id && (
                <button
                  onClick={(e) => handleStartEdit(conv, e)}
                  className="btn btn-ghost btn-xs"
                  title="Rename"
                >
                  ✎
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to delete "${conv.title}"?`)) {
                    onDelete(conv.id);
                  }
                }}
                className="btn btn-ghost btn-xs text-error"
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
