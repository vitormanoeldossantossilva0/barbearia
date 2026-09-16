const API_URL = (
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3333"
    : "https://barbearia-k02x.onrender.com")
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const adminMatch = window.location.pathname.match(
    /^\/([^/]+)\/admin(?:\/|$)/,
  );
  const slug = adminMatch?.[1]
    ? decodeURIComponent(adminMatch[1]).trim().toLowerCase()
    : "";
  const tokenKey = slug ? `barbearia_token_${slug}` : "barbearia_token_master";
  const token = localStorage.getItem(tokenKey);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers ?? {}),
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    let message = "Não foi possível concluir a operação.";
    try {
      const body = await response.json();
      message = body.mensagem || body.message || message;
    } catch {}
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};
