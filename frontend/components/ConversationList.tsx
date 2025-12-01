'use client';

import { Conversation } from '@/lib/types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNew,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onNew}
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
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex-1 truncate">
              <h3 className="font-semibold truncate">{conv.title}</h3>
              <p className="text-xs text-gray-400">
                {new Date(conv.updated_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
