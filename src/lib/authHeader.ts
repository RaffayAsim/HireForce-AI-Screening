// Client-side authentication header management
// Tokens are issued exclusively by the server via POST /api/auth/session

export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('vision_token') || '';
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('vision_token', token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('vision_token');
  }
}

export function getAuthHeaders(userId?: string): Record<string, string> {
  const token = getAuthToken();
  if (!token) return {};
  return {
    'Authorization': `Bearer ${token}`
  };
}

// Centralized fetch wrapper guaranteeing Authorization header on all client calls
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const options: RequestInit = { ...init };
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  options.headers = headers;
  return fetch(input, options);
}
