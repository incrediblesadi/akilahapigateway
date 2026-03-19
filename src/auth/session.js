const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { readEnv } = require('../sdk/core/env');

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;

let googleClient = null;

function getGoogleClientId() {
  return readEnv('GOOGLE_CLIENT_ID', '');
}

function getSessionSecret() {
  return (
    readEnv('NEXTAUTH_SECRET', '') ||
    readEnv('SESSION_SECRET', '') ||
    readEnv('CONTROLLER_API_KEY', '')
  );
}

function getSessionTtlSeconds() {
  const raw = Number(readEnv('SESSION_TTL_SECONDS', String(DEFAULT_TTL_SECONDS)));
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_SECONDS;
}

function getGoogleClient() {
  if (!googleClient) {
    googleClient = new OAuth2Client(getGoogleClientId());
  }
  return googleClient;
}

function getAuthConfig() {
  return {
    googleClientId: getGoogleClientId(),
    googleConfigured: Boolean(getGoogleClientId()),
    sessionConfigured: Boolean(getSessionSecret()),
    ttlSeconds: getSessionTtlSeconds()
  };
}

async function verifyGoogleCredential(credential) {
  if (!credential) {
    throw new Error('Google credential is required');
  }

  const { googleConfigured, googleClientId } = getAuthConfig();
  if (!googleConfigured) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const ticket = await getGoogleClient().verifyIdToken({
    idToken: credential,
    audience: googleClientId
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload?.email) {
    throw new Error('Google credential payload is missing required claims');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || '',
    emailVerified: Boolean(payload.email_verified)
  };
}

function signGatewayToken(user) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('No session signing secret is configured');
  }

  return jwt.sign(
    {
      uid: user.uid || user.sub,
      sub: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture || '',
      role: user.role || 'member',
      status: user.status || 'active',
      provider: 'google'
    },
    secret,
    {
      algorithm: 'HS256',
      issuer: 'akilahapigateway',
      audience: 'akilah-dashboard',
      expiresIn: getSessionTtlSeconds()
    }
  );
}

function verifyGatewayToken(token) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('No session signing secret is configured');
  }

  return jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: 'akilahapigateway',
    audience: 'akilah-dashboard'
  });
}

function extractBearerToken(req) {
  const authHeader = typeof req.headers.authorization === 'string'
    ? req.headers.authorization
    : '';

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const fallbackHeader = req.headers['x-akilah-token'];
  return typeof fallbackHeader === 'string' ? fallbackHeader.trim() : '';
}

function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Authentication required' });
    }

    req.user = verifyGatewayToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: error.message || 'Invalid token' });
  }
}

module.exports = {
  extractBearerToken,
  getAuthConfig,
  requireAuth,
  signGatewayToken,
  verifyGatewayToken,
  verifyGoogleCredential
};
