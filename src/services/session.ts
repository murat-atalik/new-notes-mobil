import { localStorage } from '../lib/storage';

/**
 * Session token issued by `/api/auth/*`. Sent as `Authorization: Bearer` on every
 * API call; a 401 from the server triggers `onUnauthorized` (back to login).
 */
export const SESSION_TOKEN_KEY = 'sfl_mobile_session_token';

let unauthorizedHandler: () => void = () => {};

export const getSessionToken = () => localStorage.getItem(SESSION_TOKEN_KEY);

export function setSessionToken(token: string | null) {
  if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
  else localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  unauthorizedHandler();
}
