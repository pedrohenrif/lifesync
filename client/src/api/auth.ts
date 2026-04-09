import { apiRequest } from "./client";

export type PrimaryFocus = "FINANCE" | "HABITS" | "GOALS";

export type AuthUserPayload = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly hasCompletedOnboarding: boolean;
  readonly primaryFocus: PrimaryFocus | null;
};

export type RegisterSuccessResponse = {
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly email: string;
    readonly createdAt: string;
  };
};

export type LoginSuccessResponse = {
  readonly token: string;
  readonly user: AuthUserPayload;
};

export type MeSuccessResponse = {
  readonly user: AuthUserPayload;
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

export class OnboardingApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "OnboardingApiError";
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
    case "ACCOUNT_PENDING":
      return "Sua conta ainda está em análise. Aguarde a aprovação do administrador.";
    case "ACCOUNT_REJECTED":
      return "Sua conta foi rejeitada pelo administrador.";
    case "NAME_REQUIRED":
      return "Informe como prefere ser chamado.";
    default:
      return "Não foi possível concluir esta ação.";
  }
}

function isPrimaryFocus(value: unknown): value is PrimaryFocus {
  return value === "FINANCE" || value === "HABITS" || value === "GOALS";
}

export function parseAuthUserPayload(u: Record<string, unknown>): AuthUserPayload | null {
  const id = u.id;
  const name = u.name;
  const email = u.email;
  const role = u.role;
  if (
    typeof id !== "string" ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof role !== "string"
  ) {
    return null;
  }
  const hasCompletedOnboarding =
    typeof u.hasCompletedOnboarding === "boolean" ? u.hasCompletedOnboarding : true;
  const rawFocus = u.primaryFocus;
  const primaryFocus =
    rawFocus === null || rawFocus === undefined
      ? null
      : isPrimaryFocus(rawFocus)
        ? rawFocus
        : null;
  return {
    id,
    name,
    email,
    role,
    hasCompletedOnboarding,
    primaryFocus,
  };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<RegisterSuccessResponse> {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: { name: name.trim().length > 0 ? name : undefined, email, password },
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
  const nameOut = u.name;
  const emailOut = u.email;
  const createdAt = u.createdAt;
  if (
    typeof id !== "string" ||
    typeof nameOut !== "string" ||
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
    user: { id, name: nameOut, email: emailOut, createdAt },
  };
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginSuccessResponse> {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
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
  const userParsed = parseAuthUserPayload(data.user);
  if (typeof token !== "string" || userParsed === null) {
    throw new LoginApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  return {
    token,
    user: userParsed,
  };
}

export async function getMe(): Promise<MeSuccessResponse> {
  const response = await apiRequest("/auth/me");
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

  const userParsed = parseAuthUserPayload(data.user);
  if (userParsed === null) {
    throw new MeApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  return { user: userParsed };
}

export async function completeOnboarding(input: {
  readonly name: string;
  readonly primaryFocus?: PrimaryFocus;
}): Promise<MeSuccessResponse> {
  const response = await apiRequest("/auth/users/me/onboarding", {
    method: "PATCH",
    body: input,
  });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const payload = parseApiErrorPayload(data);
    const code =
      typeof payload.error?.code === "string"
        ? payload.error.code
        : "UNKNOWN_ERROR";
    throw new OnboardingApiError(
      response.status,
      code,
      messageForCode(code),
    );
  }

  if (!isRecord(data) || !isRecord(data.user)) {
    throw new OnboardingApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  const userParsed = parseAuthUserPayload(data.user);
  if (userParsed === null) {
    throw new OnboardingApiError(
      response.status,
      "INVALID_RESPONSE",
      "Resposta inesperada do servidor.",
    );
  }

  return { user: userParsed };
}
