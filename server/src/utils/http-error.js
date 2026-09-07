/**
 * Application error carrying an HTTP status code. Thrown by services/controllers
 * and translated to a JSON response by the error-handler middleware.
 */
export class HttpError extends Error {
  /**
   * @param {number} status HTTP status code
   * @param {string} message human-readable message
   * @param {unknown} [details] optional machine-readable detail (e.g. validation issues)
   */
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const forbidden = (message = 'Forbidden', details) => new HttpError(403, message, details);
export const notFound = (message = 'Resource not found', details) => new HttpError(404, message, details);
export const conflict = (message, details) => new HttpError(409, message, details);
