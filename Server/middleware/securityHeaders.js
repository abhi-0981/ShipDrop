/**
 * Production Security Headers Middleware
 * Adds essential HTTP security headers without requiring external dependencies.
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking by framing
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Legacy XSS filter for older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Prevent leakage of full URL path in Referer headers
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Disable browser prefetching of DNS to protect privacy
  res.setHeader("X-DNS-Prefetch-Control", "off");

  // Prevent Internet Explorer from executing downloads in site's context
  res.setHeader("X-Download-Options", "noopen");

  // Prevent Flash and Acrobat from loading cross-domain content
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

  // Enforce HTTPS in production via HSTS
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // Remove fingerprinting header
  res.removeHeader("X-Powered-By");

  next();
};

module.exports = { securityHeaders };
