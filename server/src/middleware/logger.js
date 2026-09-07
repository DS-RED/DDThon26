import { config } from '../config/index.js';

/** Minimal request logger. Silent during tests to keep output clean. */
export function requestLogger(req, res, next) {
  if (config.nodeEnv === 'test') return next();

  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
}
