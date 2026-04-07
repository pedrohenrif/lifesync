const GATEWAY_URL = "http://localhost:3000/api";

const TOKEN_STORAGE_KEY = "@lifesync:token";

type ApiRequestOptions = {
  readonly method?: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
};

export async function apiRequest(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token !== null && token.length > 0) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${GATEWAY_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}
