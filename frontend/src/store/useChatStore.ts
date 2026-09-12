import { create } from 'zustand';
import { Conversation, Message } from '../types';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isGenerating: boolean;
  modelId: string;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setCurrentConversation: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setModelId: (modelId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isGenerating: false,
  modelId: 'gemini-3.8-flash', // 👈 Updated to latest stable model
  
  setConversations: (conversations) => set({ conversations }),
  
  addConversation: (conversation) => set((state) => ({ 
    conversations: [conversation, ...state.conversations] 
  })),
  
  updateConversation: (id, updates) => set((state) => ({
    conversations: state.conversations.map(c => 
      (c.id === id || (c as any)._id === id) ? { ...c, ...updates } : c
    )
  })),
  
  deleteConversation: (id) => set((state) => ({
    conversations: state.conversations.filter(
      c => c.id !== id && (c as any)._id !== id
    ),
    currentConversationId: state.currentConversationId === id ? null : state.currentConversationId
  })),
  
  setCurrentConversation: (id) => set({ currentConversationId: id, messages: [] }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  updateLastMessage: (content) => set((state) => {
    const newMessages = [...state.messages];
    if (newMessages.length > 0) {
      newMessages[newMessages.length - 1].content = content;
    }
    return { messages: newMessages };
  }),
  
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  setModelId: (modelId) => set({ modelId }),
}));