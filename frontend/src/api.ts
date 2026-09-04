const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";
const TOKEN_KEY = "rjane_pos_token";

export function setApiToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getApiToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getApiToken();
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
  if (!response.ok) {
    const validationMessage = data.errors ? Object.values(data.errors)[0]?.[0] : undefined;
    throw new Error(validationMessage ?? data.message ?? "The request could not be completed.");
  }
  return data as T;
}
