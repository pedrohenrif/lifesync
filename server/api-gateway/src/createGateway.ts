import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';

const buildRoutes = (): Record<string, string> => ({
  '/api/auth': env.authUrl,
  '/api/goals': env.goalsUrl,
  '/api/habits': env.habitsUrl,
  '/api/transactions': env.financeUrl,
  '/api/finance': env.financeUrl,
  '/api/investments': env.financeUrl,
  '/api/journal': env.journalUrl,
  '/api/vault': env.vaultUrl,
});

export const createGateway = () => {
  const app = express();
  const routes = buildRoutes();
  const prefixes = Object.keys(routes);

  app.use(helmet());
  app.use(cors());
  app.use(morgan('dev'));

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ service: 'api-gateway', status: 'ok' });
  });

  // Sem este guard, uma rota desconhecida chega ao proxy sem target e derruba a request.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isProxied = prefixes.some((prefix) => req.path.startsWith(prefix));
    if (!isProxied) {
      res.status(404).json({ error: { code: 'NOT_FOUND' } });
      return;
    }
    next();
  });

  app.use(createProxyMiddleware({
    changeOrigin: true,
    router: routes,
    pathRewrite: {
      '^/api': ''
    }
  }));

  return app;
};
