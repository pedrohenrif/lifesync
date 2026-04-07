import { apiRequest } from "./client";

export type RegisterSuccessResponse = {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly createdAt: string;
  };
};

export type LoginSuccessResponse = {
  readonly token: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
  };
};

export type MeSuccessResponse = {
  readonly user: {
    readonly id: string;
    readonly email: string;
  };
};

type ApiErrorPayload = {
  readonly error?: {
    readonly code?: string;
    readonly issues?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseApiErrorPayload(data: unknown): ApiErrorPayload {
  if (!isRecord(data)) {
    return {};
  }
  const err = data.error;
  if (!isRecord(err)) {
    return {};
  }
  const code = err.code;
  const issues = err.issues;
  return {
    error: {
      ...(typeof code === "string" ? { code } : {}),
      ...(issues !== undefined ? { issues } : {}),
    },
  };
}

export class RegisterApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "RegisterApiError";
    this.status = status;
    this.code = code;
  }
}

export class LoginApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "LoginApiError";
    this.status = status;
    this.code = code;
  }
}

export class MeApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "MeApiError";
    this.status = status;
    this.code = code;
  }
}

function messageForCode(code: string): string {
  switch (code) {
    case "EMAIL_ALREADY_EXISTS":
      return "Este e-mail já está cadastrado.";
    case "PASSWORD_TOO_SHORT":
      return "A senha deve ter pelo menos 8 caracteres.";
    case "EMAIL_REQUIRED":
      return "Informe um e-mail válido.";
    case "EMAIL_INVALID":
      return "E-mail inválido.";
    case "PASSWORD_HASH_REQUIRED":
      return "Não foi possível processar a senha.";
    case "INVALID_BODY":
      return "Dados inválidos. Verifique os campos.";
    case "INVALID_CREDENTIALS":
      return "E-mail ou senha inválidos.";
    default:
      return "Não foi possível criar a conta.";
  }
}

export async function registerUser(
  email: string,
  password: string,
): Promise<RegisterSuccessResponse> {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: { email, password },
    service: "auth",
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const payload = parseApiErrorPayload(data);
    const code =
      typeof payload.error?.code === "string"
        ? payload.error.code
        : "UNKNOWN_ERROR";
    throw new RegisterApiError(
      response.status,
      code,
      messageForCode(code),
    );
  }

  if (!isRecord(data) || !isRecord(data.user)) {
    throw new RegisterApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  const u = data.user;
  const id = u.id;
  const emailOut = u.email;
  const createdAt = u.createdAt;
  if (
    typeof id !== "string" ||
    typeof emailOut !== "string" ||
    typeof createdAt !== "string"
  ) {
    throw new RegisterApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  return {
    user: { id, email: emailOut, createdAt },
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginSuccessResponse> {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
    service: "auth",
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const payload = parseApiErrorPayload(data);
    const code =
      typeof payload.error?.code === "string"
        ? payload.error.code
        : "UNKNOWN_ERROR";
    throw new LoginApiError(response.status, code, messageForCode(code));
  }

  if (!isRecord(data) || !isRecord(data.user)) {
    throw new LoginApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  const token = data.token;
  const user = data.user;
  const id = user.id;
  const emailOut = user.email;
  if (
    typeof token !== "string" ||
    typeof id !== "string" ||
    typeof emailOut !== "string"
  ) {
    throw new LoginApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  return {
    token,
    user: {
      id,
      email: emailOut,
    },
  };
}

export async function getMe(): Promise<MeSuccessResponse> {
  const response = await apiRequest("/auth/me", { service: "auth" });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const payload = parseApiErrorPayload(data);
    const code =
      typeof payload.error?.code === "string"
        ? payload.error.code
        : "UNKNOWN_ERROR";
    throw new MeApiError(response.status, code, "Sessao invalida.");
  }

  if (!isRecord(data) || !isRecord(data.user)) {
    throw new MeApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  const id = data.user.id;
  const email = data.user.email;
  if (typeof id !== "string" || typeof email !== "string") {
    throw new MeApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  return { user: { id, email } };
}
