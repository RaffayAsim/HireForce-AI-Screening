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
