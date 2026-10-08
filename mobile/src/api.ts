import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'rjane_pos_token';
const REQUEST_TIMEOUT_MS = 15_000;

type ErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getDevelopmentHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  if (!hostUri) return null;

  try {
    return new URL(`http://${hostUri}`).hostname;
  } catch {
    return hostUri.split(':')[0] || null;
  }
}

function getApiBase(): string {
  const configuredBase = process.env.EXPO_PUBLIC_API_BASE?.trim();
  if (configuredBase) return configuredBase.replace(/\/+$/, '');

  if (__DEV__) {
    const developmentHost = getDevelopmentHost();
    if (developmentHost) return `http://${developmentHost}:8000/api`;
    if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api';
    return 'http://localhost:8000/api';
  }

  throw new Error('EXPO_PUBLIC_API_BASE must be configured for production builds.');
}

async function readStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function writeStoredToken(token: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    return;
  }

  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

let apiToken: string | null = null;

export async function restoreApiToken(): Promise<string | null> {
  apiToken = await readStoredToken();
  return apiToken;
}

export async function setApiToken(token: string | null): Promise<void> {
  apiToken = token;
  await writeStoredToken(token);
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export async function api<T>(path: string, options: RequestInit = {}, token: string | null = apiToken, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = options.signal;
  const abortFromCaller = () => controller.abort();
  externalSignal?.addEventListener('abort', abortFromCaller, { once: true });
  if (externalSignal?.aborted) controller.abort();

  try {
    const response = await fetch(`${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const body = await response.text();
    let data: unknown = {};

    if (body) {
      try {
        data = JSON.parse(body);
      } catch {
        throw new ApiError(response.ok ? 'The server returned invalid JSON.' : 'The server returned an invalid response.', response.status);
      }
    }

    if (!response.ok) {
      const payload = data as ErrorPayload;
      const validationMessage = payload.errors ? Object.values(payload.errors).flat().find(Boolean) : undefined;
      throw new ApiError(validationMessage ?? payload.message ?? 'The request could not be completed.', response.status, payload.errors);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(externalSignal?.aborted ? 'The request was cancelled.' : 'The server took too long to respond. Please try again.', 0);
    }
    throw new ApiError('Could not connect to the server. Check the API address and your network connection.', 0);
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener('abort', abortFromCaller);
  }
}
