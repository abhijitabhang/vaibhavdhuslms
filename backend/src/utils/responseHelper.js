export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

export const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null, code = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
    errors,
    timestamp: new Date().toISOString()
  });
};
