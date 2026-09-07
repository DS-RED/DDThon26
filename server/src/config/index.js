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
};

export const isTest = () => config.nodeEnv === 'test';
