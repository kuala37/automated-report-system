import { create } from 'zustand';
import { auth } from '../api/ApiClient';

interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated';
  user: any | null;
  token: string | null;
  setToken: (token: string | null) => void;
  setUser: (user: any) => void;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  token: localStorage.getItem('token'),
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  setUser: (user) => {
    set({ user, status: user ? 'authenticated' : 'unauthenticated' });
  },

  login: async (credentials) => {
    try {
      const response = await auth.login(credentials);
      if (response.access_token) {
        set({ 
          token: response.access_token,
          user: response.user,
          status: 'authenticated' 
        });
      }
    } catch (error) {
      set({ 
        user: null, 
        token: null, 
        status: 'unauthenticated' 
      });
      throw error;
    }
  },

  logout: () => {
    set({ user: null, token: null, status: 'unauthenticated' });
    localStorage.removeItem('token');
  },

  checkAuth: async () => {
    try {
      if (!localStorage.getItem('token')) {
        throw new Error('No token');
      }
      const user = await auth.getCurrentUser();
      set({ user, status: 'authenticated' });
    } catch {
      set({ user: null, status: 'unauthenticated', token: null });
      localStorage.removeItem('token');
    }
  },
}));