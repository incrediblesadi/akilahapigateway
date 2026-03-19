const express = require('express');
const {
  createGoogleAuthUrl,
  exchangeGoogleCode,
  getAuthConfig,
  getGoogleRedirectUri,
  requireAuth,
  sanitizeNextPath,
  signGatewayToken,
  verifyOAuthState,
  verifyGoogleCredential
} = require('../auth/session');
const {
  ensureUserRecord,
  getUserByUid
} = require('../sdk/dynamicRegistry');

const router = express.Router();

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAuthResultPage({ ok, token = '', next = '/', message = '' }) {
  const safeNext = sanitizeNextPath(next || '/');
  const payload = JSON.stringify({
    ok: Boolean(ok),
    token,
    next: safeNext,
    message
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Akilah Sign-In</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #07111b;
        color: #d7e6f3;
        font-family: "SF Mono", "IBM Plex Sans", "Segoe UI", sans-serif;
      }
      .panel {
        width: min(560px, calc(100vw - 32px));
        padding: 24px;
        border: 1px solid rgba(113, 159, 191, 0.2);
        background: rgba(8, 18, 30, 0.92);
      }
      a {
        color: #7af4c3;
      }
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>${ok ? 'Signing you in…' : 'Sign-in failed'}</h1>
      <p>${escapeHtml(message || (ok ? 'Completing login and returning to the dashboard.' : 'Unable to complete Google sign-in.'))}</p>
      <p><a href="${escapeHtml(safeNext)}">Continue</a></p>
    </div>
    <script>
      (function () {
        var payload = ${payload};
        try {
          if (payload.ok && payload.token) {
            localStorage.setItem('akilah_gateway_token', payload.token);
          }
          if (!payload.ok) {
            localStorage.removeItem('akilah_gateway_token');
          }
        } catch (error) {
        }
        window.location.replace(payload.next || '/');
      })();
    </script>
  </body>
</html>`;
}

router.get('/auth/config', (req, res) => {
  const config = getAuthConfig();

  res.json({
    ok: true,
    auth: {
      provider: 'google',
      googleClientId: config.googleClientId,
      googleConfigured: config.googleConfigured,
      googleClientSecretConfigured: config.googleClientSecretConfigured,
      signInPath: '/auth/google/start',
      redirectUri: getGoogleRedirectUri(req),
      sessionConfigured: config.sessionConfigured,
      ttlSeconds: config.ttlSeconds
    }
  });
});

router.get('/auth/google/start', (req, res) => {
  try {
    const authUrl = createGoogleAuthUrl(req, { next: req.query.next || '/' });
    res.redirect(authUrl);
  } catch (error) {
    res.status(503).send(renderAuthResultPage({
      ok: false,
      next: '/',
      message: error.message || 'Google sign-in is not configured'
    }));
  }
});

router.get('/auth/google/callback', async (req, res) => {
  try {
    if (req.query.error) {
      throw new Error(String(req.query.error));
    }

    const state = verifyOAuthState(String(req.query.state || ''));
    const { profile } = await exchangeGoogleCode(req, String(req.query.code || ''));
    const user = await ensureUserRecord({
      ...profile,
      uid: `google_${profile.sub}`
    });

    if (user.status !== 'active') {
      return res.status(403).send(renderAuthResultPage({
        ok: false,
        next: state.next || '/',
        message: `User status is ${user.status}`
      }));
    }

    const token = signGatewayToken(user);

    return res.send(renderAuthResultPage({
      ok: true,
      token,
      next: state.next || '/',
      message: `Signed in as ${user.email}`
    }));
  } catch (error) {
    return res.status(401).send(renderAuthResultPage({
      ok: false,
      next: '/',
      message: error.message || 'Google sign-in failed'
    }));
  }
});

router.post('/auth/google', async (req, res) => {
  try {
    const googleUser = await verifyGoogleCredential(req.body?.credential);
    const user = await ensureUserRecord({
      ...googleUser,
      uid: `google_${googleUser.sub}`
    });

    if (user.status !== 'active') {
      return res.status(403).json({
        ok: false,
        error: `User status is ${user.status}`
      });
    }

    const token = signGatewayToken(user);

    res.json({
      ok: true,
      token,
      ttlSeconds: getAuthConfig().ttlSeconds,
      user
    });
  } catch (error) {
    res.status(401).json({
      ok: false,
      error: error.message || 'Google sign-in failed'
    });
  }
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const user = await getUserByUid(req.user.uid || `google_${req.user.sub}`);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'User record not found' });
  }

  res.json({
    ok: true,
    user
  });
});

router.post('/auth/logout', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
