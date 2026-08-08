// lib/api.ts
// Thin fetch wrapper: attaches the Bearer token, parses JSON, and
// surfaces server error messages consistently. Mirrors the backend's
// { error: string } contract so pages can render the message directly.

export const TOKEN_KEY = 'farmerai.token';

export function getToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const requestHeaders: Record<string, string> = {
    ...((headers as Record<string, string> | undefined) ?? {}),
  };

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      payload = body; // browser sets the multipart boundary for us
    } else {
      requestHeaders['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  const token = getToken();
  if (token) requestHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { ...rest, headers: requestHeaders, body: payload });

  // A 401 on any authed call means the session is gone (expired token,
  // rotated secret, logged out elsewhere). Notify the auth provider so
  // the guard bounces to /auth.
  const isAuthCall = path.startsWith('/api/login') || path.startsWith('/api/register');
  if (res.status === 401 && !isAuthCall) {
    window.dispatchEvent(new Event('farmerai:logout'));
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'error' in (data as object)
        ? String((data as { error: unknown }).error)
        : `Request failed with status ${res.status}.`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}
