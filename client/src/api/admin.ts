import { apiRequest } from "./client";

export type PendingUser = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: string;
};

export type PendingUsersResponse = {
  readonly users: PendingUser[];
};

export type ReviewDecision = "ACTIVE" | "REJECTED";

export type ReviewUserResponse = {
  readonly id: string;
  readonly status: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

function extractErrorCode(data: unknown): string {
  if (!isRecord(data)) return "UNKNOWN_ERROR";
  const err = data.error;
  if (!isRecord(err)) return "UNKNOWN_ERROR";
  return typeof err.code === "string" ? err.code : "UNKNOWN_ERROR";
}

async function adminRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await apiRequest(path, options);
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const code = extractErrorCode(data);
    throw new AdminApiError(response.status, code, `Erro: ${code}`);
  }

  return data as T;
}

export async function getPendingUsers(): Promise<PendingUsersResponse> {
  return adminRequest<PendingUsersResponse>("/auth/admin/users/pending");
}

export async function reviewUser(
  userId: string,
  status: ReviewDecision,
): Promise<ReviewUserResponse> {
  return adminRequest<ReviewUserResponse>(`/auth/admin/users/${userId}/status`, {
    method: "PATCH",
    body: { status },
  });
}
