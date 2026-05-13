const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX || 240);
const buckets = new Map();

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

function rateLimiter(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = buckets.get(key) || { count: 0, resetAt: now + WINDOW_MS };

  if (current.resetAt <= now) {
    current.count = 0;
    current.resetAt = now + WINDOW_MS;
  }

  current.count += 1;
  buckets.set(key, current);

  res.setHeader('RateLimit-Limit', String(MAX_REQUESTS));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - current.count)));

  if (current.count > MAX_REQUESTS) {
    return res.status(429).json({ message: 'Слишком много запросов, попробуйте позже' });
  }

  return next();
}

module.exports = {
  securityHeaders,
  rateLimiter,
};
