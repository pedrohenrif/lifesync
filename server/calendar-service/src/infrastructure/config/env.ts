import "dotenv/config";

function readPort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65_535) return fallback;
  return parsed;
}

function readRequiredString(raw: string | undefined, name: string): string {
  if (raw === undefined || raw.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return raw;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: readPort(process.env.PORT, 4007),
  jwtSecret: readRequiredString(process.env.JWT_SECRET, "JWT_SECRET"),
  calendarMongoUri:
    process.env.CALENDAR_MONGODB_URI ?? "mongodb://localhost:27024/lifesync_calendar",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/calendar/oauth/callback",
  appUrl: process.env.APP_URL ?? "http://localhost:5173",
  tokenEncryptionKey: process.env.TOKEN_ENCRYPTION_KEY ?? "",
  calendarTimeZone: process.env.CALENDAR_TIMEZONE ?? "America/Sao_Paulo",
} as const;
