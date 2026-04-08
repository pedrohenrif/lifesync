import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js'; 

export const createGateway = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: ['http://localhost:5173', 'https://lifesync.agrosync.cloud'] }));
  app.use(morgan('dev'));

  const setupProxy = (path: string, target: string) => {
    app.use(path, createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', 
      },
    }));
  };

  setupProxy('/api/auth', env.authUrl);
  setupProxy('/api/goals', env.goalsUrl);
  setupProxy('/api/habits', env.habitsUrl);
  setupProxy('/api/transactions', env.financeUrl);
  setupProxy('/api/investments', env.financeUrl);
  setupProxy('/api/journal', env.journalUrl);
  setupProxy('/api/vault', env.vaultUrl);

  return app;
};