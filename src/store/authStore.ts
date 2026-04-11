import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { User } from '@/types/user';

interface AuthState {
  session: Session | null;
  profile: User | null;
  hydrated: boolean;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: User | null) => void;
  setHydrated: (hydrated: boolean) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  hydrated: false,
  isLoading: false,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setHydrated: (hydrated) => set({ hydrated }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      session: null,
      profile: null,
      hydrated: true,
      isLoading: false,
    }),
}));
