import { HttpError } from '../utils/http-error.js';
import { config } from '../config/index.js';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `Not found: ${req.method} ${req.originalUrl}` } });
}

/** Central error handler. Must have 4 args for Express to recognize it. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { message: err.message, ...(err.details !== undefined ? { details: err.details } : {}) },
    });
  }

  if (config.nodeEnv !== 'test') {
    console.error('Unhandled error:', err);
  }
  return res.status(500).json({ error: { message: 'Internal server error' } });
}
