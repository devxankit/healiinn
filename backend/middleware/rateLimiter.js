const rateLimit = require('express-rate-limit');

// General rate limiter
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000;
const max = Number(process.env.RATE_LIMIT_MAX) || 120;

const limiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

// Stricter rate limiter for authentication endpoints (login, signup)
const authWindowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX) || 5;

const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
});

// Rate limiter for password reset endpoints
const passwordResetWindowMs = Number(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000; // 1 hour
const passwordResetMax = Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX) || 3;

const passwordResetRateLimiter = rateLimit({
  windowMs: passwordResetWindowMs,
  max: passwordResetMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.',
  },
});

// Rate limiter for OTP endpoints
const otpWindowMs = Number(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 5 * 60 * 1000; // 5 minutes
const otpMax = Number(process.env.OTP_RATE_LIMIT_MAX) || 3;

const otpRateLimiter = rateLimit({
  windowMs: otpWindowMs,
  max: otpMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 5 minutes.',
  },
});

module.exports = limiter;
module.exports.authRateLimiter = authRateLimiter;
module.exports.passwordResetRateLimiter = passwordResetRateLimiter;
module.exports.otpRateLimiter = otpRateLimiter;

