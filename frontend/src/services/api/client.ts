let csrf: string | null = null;
export const setCsrf = (value: string | null) => {
  csrf = value;
};
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch('/api' + path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new ApiError(data.error || 'Request failed. Retry.', response.status, data.code);
  return data;
}
export const send = <T>(path: string, method: string, body: unknown = {}) =>
  api<T>(path, { method, body: JSON.stringify(body) });
