// Small API helper: stores JWT and adds Authorization header automatically.
const TOKEN_KEY = 'tm_token';

export const getToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (t: string | null) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

export function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers });
}

export async function apiJson<T = any>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await authFetch(input, init);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && getToken() && !input.includes('/auth/login') && !input.includes('/auth/change-password')) {
    // Session expired / token no longer valid -> sign out cleanly
    setToken(null);
    try { localStorage.removeItem('tm_user'); } catch { /* ignore */ }
    window.location.reload();
  }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
}
