import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 
  | 'ngo_admin' 
  | 'field_reporter' 
  | 'volunteer' 
  | 'community_member' 
  | 'super_admin';

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  org_id?: string;
  must_reset_password?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (user, token) => set({
        user,
        accessToken: token,
        isAuthenticated: true,
      }),

      logout: () => {
        // Clear local storage but the cookie is handled by the browser/backend
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'community-pulse-auth',
      // Persist user and token to survive page refreshes
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
