import "dotenv/config";

function readPort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65_535) {
    return fallback;
  }
  return parsed;
}

function readRequiredString(raw: string | undefined, name: string): string {
  if (raw === undefined || raw.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return raw;
}

function readOptionalTrimmed(raw: string | undefined): string {
  return (raw ?? "").trim();
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: readPort(process.env.PORT, 4000),
  jwtSecret: readRequiredString(process.env.JWT_SECRET, "JWT_SECRET"),
  authMongoUri:
    process.env.AUTH_MONGODB_URI ?? "mongodb://localhost:27017/lifesync_auth",
  /** Chave compartilhada com habits/goals para POST /auth/internal/gamification/events */
  internalGamificationKey: (process.env.INTERNAL_GAMIFICATION_KEY ?? "").trim(),
  /** Base URL do habits-service (cron de lembretes). Ex.: http://localhost:4002 */
  habitsServiceUrl: readOptionalTrimmed(process.env.HABITS_SERVICE_URL) || "http://localhost:4002",
  vapidPublicKey: readOptionalTrimmed(process.env.VAPID_PUBLIC_KEY),
  vapidPrivateKey: readOptionalTrimmed(process.env.VAPID_PRIVATE_KEY),
  /** Ex.: mailto:contato@seudominio.com */
  vapidSubject: readOptionalTrimmed(process.env.VAPID_SUBJECT) || "mailto:support@lifesync.local",
  /** `true` para agendar lembrete diário 20h (America/Sao_Paulo) */
  enablePushReminderCron: readOptionalTrimmed(process.env.ENABLE_PUSH_REMINDER_CRON).toLowerCase() === "true",
} as const;

export const vapidIsConfigured: boolean =
  env.vapidPublicKey.length > 0 && env.vapidPrivateKey.length > 0;
