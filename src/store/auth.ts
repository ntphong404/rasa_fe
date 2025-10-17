import { IUser } from '@/interfaces/user.interface';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  //Xem có đăng nhập hay không
  isAuthenticated: boolean;
  //User data
  user: IUser | null;
  clientId: string | null;
  //Actions
  setAuth: (isAuthenticated: boolean, clientId: string | null) => void;
  logout: () => void;
  updateUser: (user: Partial<IUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      clientId: null,

      setAuth: (isAuthenticated: boolean, clientId: string | null) => {
        set({ isAuthenticated, clientId });
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, clientId: null });

        // Xóa localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('auth-storage');

        // Xóa tất cả cookies
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          // Xóa cookie với tất cả các path và domain có thể
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
        }

        // Xóa sessionStorage
        sessionStorage.clear();
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
