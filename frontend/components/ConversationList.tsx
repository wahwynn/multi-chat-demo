'use client';

import { Conversation, MODEL_OPTIONS } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onNew: (models: string[]) => void;  // Changed to accept array
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
  const [selectedModels, setSelectedModels] = useState<string[]>(['claude-sonnet-4-5']);  // Changed to array
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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

  const handleOpenDeleteModal = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conv);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      onDelete(conversationToDelete.id);
    }
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  const handleModelToggle = (modelValue: string) => {
    if (selectedModels.includes(modelValue)) {
      // Remove if already selected (but keep at least one)
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter(m => m !== modelValue));
      }
    } else {
      setSelectedModels([...selectedModels, modelValue]);
    }
  };

  return (
    <div className="w-80 bg-base-200 flex flex-col h-full">
      <div className="p-4 border-b border-base-300">
        <div className="mb-3">
          <div className="text-sm font-semibold mb-2">
            Select Models ({selectedModels.length})
          </div>
          <div className="relative w-full" ref={dropdownRef}>
            <button
              type="button"
              className="btn btn-outline w-full justify-between"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span className="truncate">
                {selectedModels.length === 0
                  ? 'Select models...'
                  : selectedModels.length === 1
                  ? MODEL_OPTIONS.find(opt => opt.value === selectedModels[0])?.label
                  : `${selectedModels.length} models selected`}
              </span>
              <svg
                className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <ul className="absolute left-0 right-0 top-full mt-1 bg-base-100 rounded-box z-50 p-2 shadow-lg border border-base-300">
                {MODEL_OPTIONS.map((option) => (
                  <li key={option.value} className="list-none">
                    <label className="flex items-center cursor-pointer gap-3 py-2 px-2 hover:bg-base-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(option.value)}
                        onChange={() => handleModelToggle(option.value)}
                        className="checkbox checkbox-sm border-2 border-base-content/60 bg-base-100"
                      />
                      <span className="label-text">{option.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          onClick={() => onNew(selectedModels)}
          className="btn w-full text-base font-bold shadow-lg hover:shadow-xl transition-all py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white border-none"
          disabled={selectedModels.length === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`p-4 cursor-pointer hover:bg-base-300 border-b border-base-300 flex justify-between items-center transition-colors ${
              selectedId === conv.id ? 'bg-base-300' : ''
            }`}
            onClick={() => editingId !== conv.id && onSelect(conv.id)}
          >
            <div className="flex-1 min-w-0 pr-2">
              {editingId === conv.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, conv.id)}
                  onBlur={() => handleSaveEdit(conv.id)}
                  className="input input-bordered input-sm w-full text-base"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <h3
                    className="font-semibold truncate cursor-text hover:text-primary transition-colors text-base mb-1"
                    onDoubleClick={(e) => handleStartEdit(conv, e)}
                  >
                    {conv.title}
                  </h3>
                  <p className="text-sm opacity-70 mb-1">
                    {conv.selected_models.length} model{conv.selected_models.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs opacity-60 mb-1 break-words">
                    {conv.selected_models.map(m => MODEL_OPTIONS.find(opt => opt.value === m)?.label || m).join(', ')}
                  </p>
                  <p className="text-sm opacity-60">
                    {new Date(conv.updated_at).toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </>
              )}
            </div>
            <div className="ml-2 flex gap-1 flex-shrink-0">
              {editingId !== conv.id && (
                <button
                  onClick={(e) => handleStartEdit(conv, e)}
                  className="btn btn-ghost btn-sm text-base"
                  title="Rename"
                >
                  ✎
                </button>
              )}
              <button
                onClick={(e) => handleOpenDeleteModal(conv, e)}
                className="btn btn-ghost btn-sm text-error text-xl"
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <dialog className={`modal ${deleteModalOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-xl mb-4">Delete Conversation</h3>
          <p className="py-4 text-base leading-relaxed">
            Are you sure you want to delete <span className="font-semibold">&quot;{conversationToDelete?.title}&quot;</span>? This action cannot be undone.
          </p>
          <div className="modal-action">
            <button onClick={handleCancelDelete} className="btn btn-lg">
              Cancel
            </button>
            <button onClick={handleConfirmDelete} className="btn btn-error btn-lg">
              Delete
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={handleCancelDelete}></div>
      </dialog>
    </div>
  );
}
