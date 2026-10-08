const API_BASE = (import.meta.env.VITE_API_BASE?.trim() || "/api").replace(/\/+$/, "");
const TOKEN_KEY = "rjane_pos_token";

export function setApiToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getApiToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (__HOSTED_API_MISSING__) {
    throw new Error("The website's backend connection has not been configured. Contact the administrator to enable online sign-in.");
  }
  const token = getApiToken();
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "omit",
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error("Cannot reach the server. Check your internet connection or contact the administrator.");
  }
  let data: { message?: string; errors?: Record<string, string[]> };
  try {
    data = await response.json();
    if (data === null || typeof data !== "object" || Array.isArray(data)) throw new Error();
  } catch {
    throw new Error(`The server did not return a valid API response (HTTP ${response.status}). Contact the administrator to check the backend connection.`);
  }
  if (!response.ok) {
    const validationMessage = data.errors ? Object.values(data.errors)[0]?.[0] : undefined;
    throw new Error(validationMessage ?? data.message ?? `The server could not complete the request (HTTP ${response.status}). Please try again or contact the administrator.`);
  }
  return data as T;
}
