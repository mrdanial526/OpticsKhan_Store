// @ts-check
/**
 * Lightweight signed-token auth (HMAC-SHA256), no external dependencies.
 * Token format: base64url(JSON payload) + "." + base64url(signature)
 */
const crypto = require('crypto');

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** @returns {string} */
function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set (16+ chars) in production');
  }
  // Dev/test fallback: random per-process secret (tokens reset on restart)
  if (!getSecret.devSecret) {
    getSecret.devSecret = crypto.randomBytes(32).toString('hex');
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️  SESSION_SECRET not set or too short - using a temporary secret. Logins reset on restart.');
    }
  }
  return getSecret.devSecret;
}
/** @type {string | undefined} */
getSecret.devSecret = undefined;

/** @param {string} data */
const sign = data => crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');

/**
 * @typedef {{ uid: string, email: string, role: string, exp: number }} TokenPayload
 */

/**
 * @param {{ id: string, email: string, role?: string }} user
 * @returns {string}
 */
function createToken(user) {
  /** @type {TokenPayload} */
  const payload = {
    uid: user.id,
    email: user.email,
    role: user.role || 'customer',
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

/**
 * @param {string | undefined} token
 * @returns {TokenPayload | null}
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = sign(body);
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Express middleware: attaches req.user if a valid Bearer token is present.
 * @param {any} req @param {any} _res @param {Function} next
 */
function attachUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  req.user = verifyToken(token);
  next();
}

/** @param {any} req @param {any} res @param {Function} next */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
  }
  next();
}

/** @param {any} req @param {any} res @param {Function} next */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Owner sign-in required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Owner access only.' });
  }
  next();
}

module.exports = { createToken, verifyToken, attachUser, requireAuth, requireAdmin };
