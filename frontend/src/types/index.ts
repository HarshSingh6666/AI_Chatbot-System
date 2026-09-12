export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}
