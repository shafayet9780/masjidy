import { create } from 'zustand';

interface AuthState {
  hydrated: boolean;
}

export const useAuthStore = create<AuthState>(() => ({
  hydrated: false,
}));
