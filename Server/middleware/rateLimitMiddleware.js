/**
 * Lightweight, zero-dependency in-memory rate limiter middleware
 * Protects login and register endpoints against brute-force attacks.
 */

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  maxRequests = 25,
  message = "Too many attempts from this IP. Please try again after 15 minutes.",
} = {}) => {
  const store = new Map();

  // Periodic cleanup of expired rate limit windows
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(ip);
      }
    }
  }, Math.min(windowMs, 60000));

  if (interval.unref) {
    interval.unref();
  }

  return (req, res, next) => {
    // Determine client IP safely (supports proxy headers like x-forwarded-for)
    const forwarded = req.headers["x-forwarded-for"];
    const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : req.ip) ||
      req.socket?.remoteAddress ||
      "unknown-ip";

    const key = `${ip.trim()}_${req.baseUrl || ""}${req.path || ""}`;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, entry);
      return next();
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);

      return res.status(429).json({
        success: false,
        code: "TOO_MANY_REQUESTS",
        message,
        retryAfter: retryAfterSeconds,
      });
    }

    return next();
  };
};

const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30, // 30 requests per IP window
  message: "Too many login/registration attempts. Please wait 15 minutes before trying again.",
});

module.exports = {
  createRateLimiter,
  authRateLimiter,
};
