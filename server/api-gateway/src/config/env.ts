import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  authUrl: process.env.AUTH_URL ?? "http://localhost:4000",
  goalsUrl: process.env.GOALS_URL ?? "http://localhost:4001",
  habitsUrl: process.env.HABITS_URL ?? "http://localhost:4002",
  financeUrl: process.env.FINANCE_URL ?? "http://localhost:4003",
  journalUrl: process.env.JOURNAL_URL ?? "http://localhost:4004",
  vaultUrl: process.env.VAULT_URL ?? "http://localhost:4005",
} as const;
