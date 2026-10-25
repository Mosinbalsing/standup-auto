import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) {
    res.end();
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      error: error.issues[0]?.message || 'Check the request fields.',
      code: 'VALIDATION_FAILED',
    });
    return;
  }
  const status = error.status || 500;
  const message =
    error.type === 'entity.parse.failed'
      ? 'Send valid JSON.'
      : error.type === 'entity.too.large'
        ? 'Request is too large.'
        : status < 500 || error.code
          ? error.message
          : 'The server could not complete the request. Retry, or contact the administrator.';
  res.status(status).json({ error: message, code: error.code || 'SERVER_ERROR' });
};
