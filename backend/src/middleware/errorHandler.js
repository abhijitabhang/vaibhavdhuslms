import { sendError } from '../utils/responseHelper.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};
