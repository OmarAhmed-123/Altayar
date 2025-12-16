// Error handling middleware
const notFound = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const path = req.path.toLowerCase();
  
  // List of suspicious user agents and paths to ignore (don't log these)
  const suspiciousAgents = ['avast', 'scanner', 'bot', 'crawler', 'spider', 'security', 'mozilla/5.0 (windows nt'];
  const suspiciousPaths = ['/loginmsg.js', '/cgi/', '/rootdesc.xml', '/.well-known/', '/wp-admin', '/phpmyadmin', '/admin.php'];
  
  const isSuspiciousAgent = suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent));
  const isSuspiciousPath = suspiciousPaths.some(suspPath => path.includes(suspPath));
  
  // For suspicious requests, return simple 404 without logging
  if (isSuspiciousAgent || isSuspiciousPath) {
    return res.status(404).json({
      success: false,
      message: 'Not Found'
    });
  }
  
  // For legitimate API requests, provide helpful error message
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // PostgreSQL errors
  if (err.code === '23505') { // Unique constraint violation
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  if (err.code === '23503') { // Foreign key constraint violation
    message = 'Referenced resource not found';
    statusCode = 400;
  }

  if (err.code === '23502') { // Not null constraint violation
    message = 'Required field is missing';
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    if (err.errors && typeof err.errors === 'object') {
      const errorMessages = Object.values(err.errors)
        .filter(val => val && val.message)
        .map(val => val.message);
      message = errorMessages.length > 0 ? errorMessages.join(', ') : 'Validation error';
    } else {
      message = err.message || 'Validation error';
    }
    statusCode = 400;
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'File too large';
    statusCode = 400;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    message = 'Unexpected field';
    statusCode = 400;
  }

  // Ensure consistent error response format
  const errorResponse = {
    success: false,
    message: message || 'An error occurred',
  };

  // Only include stack trace and path in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.path = req.originalUrl;
    errorResponse.method = req.method;
  }

  // Log error details in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    console.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress
    });
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = { notFound, errorHandler };
