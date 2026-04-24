const BASE_URL = "https://api.umrahfly.me/api";

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const getToken = () => localStorage.getItem("token");
export const setToken = (t: string) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  let data: any = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      `Request failed (${res.status})`;
    if (res.status === 401) {
      // token invalid
      clearToken();
    }
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  del: <T = any>(path: string) => request<T>(path, { method: "DELETE" }),
};
