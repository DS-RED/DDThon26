import { badRequest } from '../utils/http-error.js';

/**
 * Returns middleware that validates req.body against a zod schema.
 * On success, the parsed value is stored on req.validated.
 * @param {import('zod').ZodTypeAny} schema
 */
export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(badRequest('Validation failed', result.error.issues));
    }
    req.validated = result.data;
    next();
  };
}
