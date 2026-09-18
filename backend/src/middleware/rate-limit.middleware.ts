import rateLimit from "express-rate-limit";

/**
 * Public result-day limiter only.
 * Admin / auth routes must NOT use this.
 *
 * Default: 120 requests / minute / IP.
 * Override with PUBLIC_RATE_LIMIT_MAX.
 */
export const publicResultRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: Math.max(30, Number(process.env.PUBLIC_RATE_LIMIT_MAX || 120)),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many result lookups from this network. Please wait a minute and try again.",
  },
});
