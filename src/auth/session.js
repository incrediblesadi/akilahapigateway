const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { readEnv } = require('../sdk/core/env');

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_OAUTH_STATE_TTL_SECONDS = 60 * 10;
const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

let googleClient = null;

function getGoogleClientId() {
  return readEnv('GOOGLE_CLIENT_ID', '');
}

function getGoogleClientSecret() {
  return readEnv('GOOGLE_CLIENT_SECRET', '');
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

function getGatewayPublicUrl(req) {
  return readEnv('GATEWAY_PUBLIC_URL', '')
    || `${req.protocol}://${req.get('host')}`;
}

function getGoogleRedirectUri(req) {
  return readEnv('GOOGLE_REDIRECT_URI', '')
    || `${getGatewayPublicUrl(req)}/auth/google/callback`;
}

function getGoogleOAuthClient(req) {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  const redirectUri = getGoogleRedirectUri(req);

  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  if (!clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET is not configured');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

function sanitizeNextPath(value) {
  const fallback = '/';
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return fallback;
  }

  if (value.startsWith('//') || value.startsWith('/auth/')) {
    return fallback;
  }

  return value;
}

function signOAuthState(next = '/') {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('No session signing secret is configured');
  }

  return jwt.sign(
    {
      next: sanitizeNextPath(next)
    },
    secret,
    {
      algorithm: 'HS256',
      issuer: 'akilahapigateway',
      audience: 'akilah-oauth-state',
      expiresIn: DEFAULT_OAUTH_STATE_TTL_SECONDS
    }
  );
}

function verifyOAuthState(token) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error('No session signing secret is configured');
  }

  return jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: 'akilahapigateway',
    audience: 'akilah-oauth-state'
  });
}

function getAuthConfig() {
  return {
    googleClientId: getGoogleClientId(),
    googleConfigured: Boolean(getGoogleClientId()),
    googleClientSecretConfigured: Boolean(getGoogleClientSecret()),
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

function createGoogleAuthUrl(req, options = {}) {
  const next = sanitizeNextPath(options.next || '/');
  const state = signOAuthState(next);

  return getGoogleOAuthClient(req).generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: GOOGLE_SCOPES,
    state
  });
}

async function exchangeGoogleCode(req, code) {
  if (!code) {
    throw new Error('Google authorization code is required');
  }

  const oauthClient = getGoogleOAuthClient(req);
  const { tokens } = await oauthClient.getToken(code);
  oauthClient.setCredentials(tokens);

  let payload = null;

  if (tokens.id_token) {
    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: getGoogleClientId()
    });
    payload = ticket.getPayload();
  }

  if (!payload?.sub || !payload?.email) {
    const response = await oauthClient.request({
      url: 'https://openidconnect.googleapis.com/v1/userinfo'
    });
    payload = response.data || null;
  }

  if (!payload?.sub || !payload?.email) {
    throw new Error('Google profile is missing required claims');
  }

  return {
    tokens,
    profile: {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || '',
      emailVerified: Boolean(payload.email_verified)
    }
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
  createGoogleAuthUrl,
  exchangeGoogleCode,
  extractBearerToken,
  getAuthConfig,
  getGatewayPublicUrl,
  getGoogleRedirectUri,
  requireAuth,
  sanitizeNextPath,
  signGatewayToken,
  signOAuthState,
  verifyOAuthState,
  verifyGatewayToken,
  verifyGoogleCredential
};
