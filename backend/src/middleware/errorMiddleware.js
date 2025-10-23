/**
 * Error handling middleware for Express
 */

/**
 * Handle 404 not found errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Global error handler
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Generate a unique request ID for error tracking
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Set status code
  const statusCode = err.status || err.statusCode || 500;

  // Determine error code and message
  let errorCode = 'server_error';
  let errorMessage = 'An unexpected error occurred';
  
  // Map common status codes to error codes and messages
  if (statusCode === 400) {
    errorCode = 'invalid_request';
    errorMessage = err.message || 'Invalid request parameters';
  } else if (statusCode === 401) {
    errorCode = 'unauthorized';
    errorMessage = 'Authentication required';
  } else if (statusCode === 403) {
    errorCode = 'forbidden';
    errorMessage = 'You do not have permission to access this resource';
  } else if (statusCode === 404) {
    errorCode = 'not_found';
    errorMessage = err.message || 'Resource not found';
  } else if (statusCode === 409) {
    errorCode = 'conflict';
    errorMessage = err.message || 'Resource conflict';
  } else if (statusCode === 422) {
    errorCode = 'validation_error';
    errorMessage = err.message || 'Validation error';
  } else if (statusCode === 429) {
    errorCode = 'rate_limited';
    errorMessage = 'Too many requests';
  } else {
    // Use provided values if available
    errorCode = err.code || errorCode;
    errorMessage = err.message || errorMessage;
  }

  // Log the error (in production, you might want to use a more robust logging solution)
  console.error(`[Error] ${requestId} - ${statusCode} - ${errorCode}: ${err.stack || err}`);

  // Send error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      ...(err.details ? { data: err.details } : {})
    },
    requestId
  });
};

module.exports = {
  notFound,
  errorHandler
};