/**
 * Routes passed as login `returnTo` that require a session; "skip" must not navigate there
 * or the user will bounce back to login (e.g. submit-time redirects unauthenticated users).
 */
export function isAuthGatedReturnPath(returnTo: string | undefined): boolean {
  if (typeof returnTo !== 'string' || returnTo.length === 0) {
    return false;
  }
  return returnTo.startsWith('/submit-time/');
}
