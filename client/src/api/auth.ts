import { apiRequest } from "./client";

export type PrimaryFocus = "FINANCE" | "HABITS" | "GOALS";

export type UserAttributes = {
  readonly health: number;
  readonly finance: number;
  readonly focus: number;
  readonly knowledge: number;
  readonly social: number;
};

export type PersonalRewardItem = {
  readonly id: string;
  readonly title: string;
  readonly costCoins: number;
  readonly createdAt: string;
};

export type AuthUserPayload = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly hasCompletedOnboarding: boolean;
  readonly primaryFocus: PrimaryFocus | null;
  readonly level: number;
  readonly currentXp: number;
  readonly xpToNextLevel: number;
  readonly totalXp: number;
  readonly coins: number;
  readonly attributes: UserAttributes;
  readonly personalRewards: readonly PersonalRewardItem[];
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

const DEFAULT_ATTRIBUTES: UserAttributes = {
  health: 0,
  finance: 0,
  focus: 0,
  knowledge: 0,
  social: 0,
};

function parseAttributes(raw: unknown): UserAttributes {
  if (typeof raw !== "object" || raw === null) {
    return { ...DEFAULT_ATTRIBUTES };
  }
  const o = raw as Record<string, unknown>;
  const n = (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
  return {
    health: n(o.health),
    finance: n(o.finance),
    focus: n(o.focus),
    knowledge: n(o.knowledge),
    social: n(o.social),
  };
}

function parsePersonalRewards(raw: unknown): PersonalRewardItem[] {
  if (!Array.isArray(raw)) return [];
  const out: PersonalRewardItem[] = [];
  for (const item of raw) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as { id?: string }).id === "string" &&
      typeof (item as { title?: string }).title === "string" &&
      typeof (item as { costCoins?: number }).costCoins === "number" &&
      typeof (item as { createdAt?: string }).createdAt === "string"
    ) {
      out.push({
        id: (item as { id: string }).id,
        title: (item as { title: string }).title,
        costCoins: Math.max(1, Math.floor((item as { costCoins: number }).costCoins)),
        createdAt: (item as { createdAt: string }).createdAt,
      });
    }
  }
  return out;
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

  const level = typeof u.level === "number" && Number.isFinite(u.level) ? Math.max(1, Math.floor(u.level)) : 1;
  const xpToNext =
    typeof u.xpToNextLevel === "number" && Number.isFinite(u.xpToNextLevel)
      ? Math.max(1, Math.floor(u.xpToNextLevel))
      : 100;
  const currentXp =
    typeof u.currentXp === "number" && Number.isFinite(u.currentXp)
      ? Math.max(0, Math.floor(u.currentXp))
      : 0;
  const totalXp =
    typeof u.totalXp === "number" && Number.isFinite(u.totalXp) ? Math.max(0, Math.floor(u.totalXp)) : 0;
  const coins = typeof u.coins === "number" && Number.isFinite(u.coins) ? Math.max(0, Math.floor(u.coins)) : 0;

  return {
    id,
    name,
    email,
    role,
    hasCompletedOnboarding,
    primaryFocus,
    level,
    currentXp,
    xpToNextLevel: xpToNext,
    totalXp,
    coins,
    attributes: parseAttributes(u.attributes),
    personalRewards: parsePersonalRewards(u.personalRewards),
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

export async function createPersonalReward(input: {
  readonly title: string;
  readonly costCoins: number;
}): Promise<{ readonly reward: PersonalRewardItem }> {
  const response = await apiRequest("/auth/users/me/rewards", {
    method: "POST",
    body: input,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new MeApiError(response.status, "CREATE_REWARD_FAILED", "Não foi possível criar a recompensa.");
  }
  if (!isRecord(data) || !isRecord(data.reward)) {
    throw new MeApiError(response.status, "INVALID_RESPONSE", "Resposta inesperada.");
  }
  const r = data.reward;
  if (
    typeof r.id !== "string" ||
    typeof r.title !== "string" ||
    typeof r.costCoins !== "number" ||
    typeof r.createdAt !== "string"
  ) {
    throw new MeApiError(response.status, "INVALID_RESPONSE", "Resposta inesperada.");
  }
  return {
    reward: {
      id: r.id,
      title: r.title,
      costCoins: r.costCoins,
      createdAt: r.createdAt,
    },
  };
}

export async function redeemPersonalReward(rewardId: string): Promise<{ readonly coins: number }> {
  const response = await apiRequest(`/auth/users/me/rewards/${encodeURIComponent(rewardId)}/redeem`, {
    method: "POST",
    body: {},
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new MeApiError(response.status, "REDEEM_FAILED", "Não foi possível resgatar.");
  }
  if (!isRecord(data) || typeof data.coins !== "number") {
    throw new MeApiError(response.status, "INVALID_RESPONSE", "Resposta inesperada.");
  }
  return { coins: Math.max(0, Math.floor(data.coins)) };
}
