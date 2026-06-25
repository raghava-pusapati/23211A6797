const { Log } = require('../../logging-middleware');

function errorHandler(err, req, res, next) {
  Log('backend', 'error', 'middleware', `Unhandled error: ${err.message}`);

  const statusCode = err.statusCode || 500;
  const msg = err.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: msg
    }
  });
}

module.exports = errorHandler;
