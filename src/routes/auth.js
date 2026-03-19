const express = require('express');
const {
  getAuthConfig,
  requireAuth,
  signGatewayToken,
  verifyGoogleCredential
} = require('../auth/session');
const {
  ensureUserRecord,
  getUserByUid
} = require('../sdk/dynamicRegistry');

const router = express.Router();

router.get('/auth/config', (req, res) => {
  const config = getAuthConfig();

  res.json({
    ok: true,
    auth: {
      provider: 'google',
      googleClientId: config.googleClientId,
      googleConfigured: config.googleConfigured,
      sessionConfigured: config.sessionConfigured,
      ttlSeconds: config.ttlSeconds
    }
  });
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
