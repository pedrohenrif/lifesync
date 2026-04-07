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
  port: readPort(process.env.PORT, 4003),
  jwtSecret: readRequiredString(process.env.JWT_SECRET, "JWT_SECRET"),
  financeMongoUri:
    process.env.FINANCE_MONGODB_URI ??
    "mongodb://localhost:27020/lifesync_finance",
} as const;
