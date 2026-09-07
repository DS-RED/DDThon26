import path from 'node:path';
import { fileURLToPath } from 'node:url';

// server/ root (this file is at server/src/config/index.js)
const serverRoot = fileURLToPath(new URL('../../', import.meta.url));

const defaultDbPath = path.join(serverRoot, 'data', 'table-order.sqlite');

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // DB_PATH may be an absolute/relative file path or the special value ':memory:'
  dbPath: process.env.DB_PATH && process.env.DB_PATH.trim() !== '' ? process.env.DB_PATH : defaultDbPath,
  serverRoot,

  // CORS allowed origins (P3/P4 SPAs run on separate dev-server origins).
  // Comma-separated list, or '*' to reflect any origin (default for local dev).
  corsOrigins: (process.env.CORS_ORIGINS && process.env.CORS_ORIGINS.trim() !== ''
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : ['*']),

  // --- Auth (P1) ---
  // JWT signing secret. A dev fallback is used when unset; MUST be set in real deployments.
  jwtSecret: process.env.JWT_SECRET && process.env.JWT_SECRET.trim() !== ''
    ? process.env.JWT_SECRET
    : 'dev-only-insecure-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '16h', // FR-A1: 16-hour admin session
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
  // Login attempt limiting (FR-A1): lock after N fails within the window.
  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS) || 5,
  loginWindowMs: Number(process.env.LOGIN_WINDOW_MS) || 15 * 60 * 1000,
};

export const isTest = () => config.nodeEnv === 'test';
