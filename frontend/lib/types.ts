export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
}

export interface AuthStatus {
  authenticated: boolean;
  user: User | null;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  model?: string;  // Which model generated this (for assistant messages)
  parent_message_id?: number;  // For grouping responses
}

export interface Conversation {
  id: number;
  title: string;
  selected_models: string[];  // Changed from single model to array
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-5', label: 'Claude 4.5 Sonnet' },
  { value: 'claude-haiku-4-5', label: 'Claude 4.5 Haiku' },
  { value: 'claude-opus-4-5', label: 'Claude 4.5 Opus' },
  { value: 'ollama-llama3.2', label: 'Ollama Llama 3.2' },
  { value: 'ollama-llama3.1', label: 'Ollama Llama 3.1' },
  { value: 'ollama-mistral', label: 'Ollama Mistral' },
  { value: 'ollama-phi3', label: 'Ollama Phi-3' },
  { value: 'github-openai/gpt-4.1', label: 'GitHub GPT-4.1' },
  { value: 'github-openai/gpt-4o-mini', label: 'GitHub GPT-4o Mini' },
  { value: 'github-openai/gpt-4o', label: 'GitHub GPT-4o' },
  { value: 'github-meta/llama-3.2-90b-vision-instruct', label: 'GitHub Llama 3.2 90B Vision' },
];

export interface ChatResponse {
  message: Message;  // User message
  assistant_messages: Message[];  // Multiple responses (one per model)
}

export interface ModelOption {
  value: string;
  label: string;
}
