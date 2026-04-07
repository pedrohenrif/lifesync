const SERVICE_URLS: Record<ServiceName, string> = {
  auth: "http://localhost:4000",
  goals: "http://localhost:4001",
  habits: "http://localhost:4002",
  finance: "http://localhost:4003",
  journal: "http://localhost:4004",
  vault: "http://localhost:4005",
};

export type ServiceName = "auth" | "goals" | "habits" | "finance" | "journal" | "vault";

const TOKEN_STORAGE_KEY = "@lifesync:token";

type ApiRequestOptions = {
  readonly method?: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly service?: ServiceName;
};

export async function apiRequest(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const base = SERVICE_URLS[options.service ?? "auth"];
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token !== null && token.length > 0) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}
