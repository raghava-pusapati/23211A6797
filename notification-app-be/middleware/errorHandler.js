const { Log } = require('../../logging-middleware');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log the error
  Log('backend', 'error', 'middleware', `Unhandled error: ${err.message}`);

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: message
    }
  });
}

module.exports = errorHandler;
