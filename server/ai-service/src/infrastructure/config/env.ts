import "dotenv/config";

const REASONING_EFFORTS = ["minimal", "low", "medium", "high"] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

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

function readNumber(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readReasoningEffort(raw: string | undefined): ReasoningEffort | null {
  if (raw === undefined || raw.trim() === "") return null;
  const value = raw.trim().toLowerCase();
  return (REASONING_EFFORTS as readonly string[]).includes(value)
    ? (value as ReasoningEffort)
    : null;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: readPort(process.env.PORT, 4006),
  jwtSecret: readRequiredString(process.env.JWT_SECRET, "JWT_SECRET"),
  aiMongoUri: process.env.AI_MONGODB_URI ?? "mongodb://localhost:27023/lifesync_ai",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  openAiReasoningEffort: readReasoningEffort(process.env.OPENAI_REASONING_EFFORT),
  openAiTimeoutMs: readNumber(process.env.OPENAI_TIMEOUT_MS, 30_000),
  monthlyBudgetUsd: readNumber(process.env.AI_MONTHLY_BUDGET_USD, 2),
} as const;
