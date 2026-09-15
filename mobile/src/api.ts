// Use environment variable or try to detect from device
const getApiBase = () => {
  if (process.env.EXPO_PUBLIC_API_BASE) {
    return process.env.EXPO_PUBLIC_API_BASE;
  }
  // Default to localhost for development
  return 'http://192.168.1.100:8000/api';
};

const API_BASE = getApiBase();

export async function api<T>(path: string, options: any = {}, token?: string | null): Promise<T> {
  await new Promise(r => setTimeout(r, 300)); // fake latency
  if (path === '/login') return { token: 'dev-token', user: { id: 1, name: 'Rica Jane', username: 'admin', role: 'admin' } } as any;
  if (path === '/products') return { data: [/* ...same dummy array... */] } as any;
  if (path === '/sales') return { data: [] } as any;
  return {} as any;
}

export function setApiToken(token: string | null) {
  void token;
}