import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

const API_URL = '/api';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch (e) {
      // Ignore JSON parse error if response is not JSON
    }
    throw new Error(errorMsg);
  }

  return response;
}

export const api = {
  auth: {
    login: async (credentials: any) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }
      return res.json();
    },
    signup: async (data: any) => {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Signup failed');
      }
      return res.json();
    },
    googleLogin: async (data: any) => {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Google login failed');
      }
      return res.json();
    },
    me: async () => {
      const res = await fetchWithAuth('/auth/me');
      return res.json();
    },
    // 👇 Added Profile & Security Methods
    updateProfile: async (data: { name?: string; profileImage?: string }) => {
      const res = await fetchWithAuth('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetchWithAuth('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    setup2fa: async () => {
      const res = await fetchWithAuth('/auth/2fa/setup', {
        method: 'POST',
      });
      return res.json();
    },
    verify2fa: async (data: { token: string }) => {
      const res = await fetchWithAuth('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
  },
  chat: {
    getConversations: async () => {
      const res = await fetchWithAuth('/conversations');
      return res.json();
    },
    createConversation: async (title?: string) => {
      const res = await fetchWithAuth('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title }),
      });
      return res.json();
    },
    getConversation: async (id: string) => {
      const res = await fetchWithAuth(`/conversations/${id}`);
      return res.json();
    },
    updateConversation: async (id: string, updates: any) => {
      const res = await fetchWithAuth(`/conversations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    deleteConversation: async (id: string) => {
      const res = await fetchWithAuth(`/conversations/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    sendMessage: async (id: string, content: string, onChunk: (text: string) => void) => {
      const token = useAuthStore.getState().token;
      
      const model = useChatStore.getState().modelId || 'gemini-3.8-flash';
      
      const response = await fetch(`${API_URL}/conversations/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          content, 
          model 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE streams
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; 
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                onChunk(data.chunk);
              }
            } catch (e) {
              console.error('Error parsing SSE data', e);
            }
          }
        }
      }
    }
  }
};