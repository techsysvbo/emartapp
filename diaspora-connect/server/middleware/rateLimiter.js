const rateLimit = require('express-rate-limit');

/**
 * Vent posts: max 5 per user per day.
 * Uses IP + user ID combo via a custom key generator.
 */
const ventLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  keyGenerator: (req) => {
    // Use user ID when authenticated, fall back to IP
    return (req.user && req.user._id ? req.user._id.toString() : req.ip);
  },
  message: { error: 'You can only post 5 vent posts per day. Please come back tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter (100 req / 15 min per IP)
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { ventLimiter, generalLimiter };
