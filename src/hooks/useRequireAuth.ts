import { usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useAuth } from '@/hooks/useAuth';

let pendingAuthenticatedAction: (() => void) | null = null;

export function consumePendingAuthenticatedAction() {
  const nextAction = pendingAuthenticatedAction;
  pendingAuthenticatedAction = null;
  return nextAction;
}

export function useRequireAuth(): {
  isAuthenticated: boolean;
  requireAuth: (onAuthenticated: () => void) => boolean;
} {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const requireAuth = useCallback(
    (onAuthenticated: () => void) => {
      if (isAuthenticated) {
        onAuthenticated();
        return true;
      }

      pendingAuthenticatedAction = onAuthenticated;
      router.push({
        pathname: '/auth/login',
        params: pathname ? { returnTo: pathname } : undefined,
      });

      return false;
    },
    [isAuthenticated, pathname, router],
  );

  return {
    isAuthenticated,
    requireAuth,
  };
}
