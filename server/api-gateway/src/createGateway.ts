import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';

export const createGateway = () => {
  const app = express();

  app.use(helmet());
  app.use(cors()); 
  app.use(morgan('dev'));

  console.log("🚀 Módulo Gateway Mestre Carregado!");

  app.use(createProxyMiddleware({
    changeOrigin: true,
    router: {
      '/api/auth': env.authUrl,
      '/api/goals': env.goalsUrl,
      '/api/habits': env.habitsUrl,
      '/api/transactions': env.financeUrl,
      '/api/finance': env.financeUrl,
      '/api/investments': env.financeUrl,
      '/api/journal': env.journalUrl,
      '/api/vault': env.vaultUrl,
    },
    pathRewrite: {
      '^/api': '' 
    }
  }));

  return app;
};