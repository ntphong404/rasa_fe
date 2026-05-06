import { IUser } from '@/interfaces/user.interface';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  //Xem có đăng nhập hay không
  isAuthenticated: boolean;
  //User data
  user: IUser | null;
  clientId: string | null;
  //Pre-access state for email verification
  isPreAccess: boolean;
  preAccessType?: string | null;
  //Actions
  setAuth: (isAuthenticated: boolean, clientId: string | null, isPreAccess?: boolean, preAccessType?: string | null) => void;
  logout: () => void;
  updateUser: (user: Partial<IUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      clientId: null,
      isPreAccess: false,
      preAccessType: null,

      setAuth: (isAuthenticated: boolean, clientId: string | null, isPreAccess: boolean = false, preAccessType: string | null = null) => {
        set({ isAuthenticated, clientId, isPreAccess, preAccessType });
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, clientId: null, isPreAccess: false, preAccessType: null });

        // Xóa localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');


        // Xóa sessionStorage
        sessionStorage.clear();

        // Xóa cookies
        const authCookies = ['token', 'refreshToken', 'refresh_token'];
        authCookies.forEach(name => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
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
        isPreAccess: state.isPreAccess,
        preAccessType: state.preAccessType,
      }),
    }
  )
);
