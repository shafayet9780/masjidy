import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { LOCAL_FOLLOW_IDS_KEY } from '@/constants/config';

interface FollowStoreState {
  followedIds: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addId: (id: string) => void;
  removeId: (id: string) => void;
  setIds: (ids: string[]) => void;
}

function parseFollowIds(raw: string | null): string[] {
  if (raw == null || raw === '') {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
  } catch {
    return [];
  }
}

async function persistFollowIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_FOLLOW_IDS_KEY, JSON.stringify(ids));
  } catch {
    // Non-fatal: in-memory state still updates.
  }
}

export const useFollowStore = create<FollowStoreState>((set, get) => ({
  followedIds: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) {
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(LOCAL_FOLLOW_IDS_KEY);
      const ids = parseFollowIds(raw);
      set({ followedIds: ids, hydrated: true });
    } catch {
      set({ followedIds: [], hydrated: true });
    }
  },

  addId: (id) => {
    const trimmed = id.trim();
    if (!trimmed) {
      return;
    }
    const current = get().followedIds;
    if (current.includes(trimmed)) {
      return;
    }
    const next = [...current, trimmed];
    set({ followedIds: next });
    void persistFollowIds(next);
  },

  removeId: (id) => {
    const trimmed = id.trim();
    if (!trimmed) {
      return;
    }
    const next = get().followedIds.filter((x) => x !== trimmed);
    set({ followedIds: next });
    void persistFollowIds(next);
  },

  setIds: (ids) => {
    const seen = new Set<string>();
    const next: string[] = [];
    for (const id of ids) {
      const t = typeof id === 'string' ? id.trim() : '';
      if (!t || seen.has(t)) {
        continue;
      }
      seen.add(t);
      next.push(t);
    }
    set({ followedIds: next });
    void persistFollowIds(next);
  },
}));

export function isFollowingId(mosqueId: string): boolean {
  const trimmed = mosqueId.trim();
  if (!trimmed) {
    return false;
  }
  return useFollowStore.getState().followedIds.includes(trimmed);
}
