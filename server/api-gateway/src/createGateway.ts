import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createProxyMiddleware, type Options } from "http-proxy-middleware";
import { env } from "./config/env.js";

type ProxyRoute = {
  readonly context: string;
  readonly target: string;
};

const proxyRoutes: readonly ProxyRoute[] = [
  { context: "/api/auth", target: env.authUrl },
  { context: "/api/goals", target: env.goalsUrl },
  { context: "/api/habits", target: env.habitsUrl },
  { context: "/api/transactions", target: env.financeUrl },
  { context: "/api/investments", target: env.financeUrl },
  { context: "/api/journal", target: env.journalUrl },
  { context: "/api/vault", target: env.vaultUrl },
];

function buildProxyOptions(target: string): Options {
  return {
    target,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
    on: {
      proxyReq: (_proxyReq, req) => {
        const url = (req as unknown as { originalUrl?: string }).originalUrl ?? req.url;
        console.log(`[Gateway] ${req.method} ${url} -> ${target}`);
      },
      error: (err, _req, res) => {
        console.error(`[Gateway] Proxy error:`, err.message);
        if ("writeHead" in res && typeof res.writeHead === "function") {
          (res as express.Response).status(502).json({ error: "Service unavailable" });
        }
      },
    },
  };
}

export function createGateway(): express.Express {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(morgan("short"));

  for (const route of proxyRoutes) {
    app.use(route.context, createProxyMiddleware(buildProxyOptions(route.target)));
  }

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", gateway: true });
  });

  return app;
}
