const errorMiddleware = (err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);

  const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.isPublic ? err.message : (err.message || 'An internal server error occurred.');

  res.status(statusCode >= 400 ? statusCode : 500).json({
    success: false,
    message: message
  });
};

module.exports = errorMiddleware;
