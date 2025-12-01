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
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full bg-gray-800 text-white text-sm py-2 px-3 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MODEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => onNew(selectedModel)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          + New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`p-4 cursor-pointer hover:bg-gray-800 border-b border-gray-700 flex justify-between items-center ${
              selectedId === conv.id ? 'bg-gray-800' : ''
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
                  className="bg-gray-700 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <h3 className="font-semibold truncate">{conv.title}</h3>
                  <p className="text-xs text-gray-500">
                    {MODEL_OPTIONS.find(m => m.value === conv.model)?.label || conv.model}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
            <div className="ml-2 flex gap-1">
              {editingId !== conv.id && (
                <button
                  onClick={(e) => handleStartEdit(conv, e)}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  title="Rename"
                >
                  ✎
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
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
