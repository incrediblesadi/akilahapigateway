const express = require('express');
const { requireAuth } = require('../auth/session');
const {
  getAccessSnapshot,
  getUserByUid,
  getWorkspaceByUid,
  grantAccess,
  listAccessibleConnectors,
  listConnectors,
  listUsersAndInvites,
  revokeAccess,
  saveConnector,
  updateUser,
  upsertInvite
} = require('../sdk/dynamicRegistry');

const router = express.Router();

async function attachCurrentUser(req, res, next) {
  try {
    const uid = req.user.uid || `google_${req.user.sub}`;
    const user = await getUserByUid(uid);

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User record not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ ok: false, error: `User status is ${user.status}` });
    }

    req.currentUser = user;
    return next();
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}

function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'Admin access required' });
  }

  return next();
}

router.get('/users/me', requireAuth, attachCurrentUser, async (req, res) => {
  const workspace = await getWorkspaceByUid(req.currentUser.uid);
  res.json({ ok: true, user: req.currentUser, workspace });
});

router.get('/me/access', requireAuth, attachCurrentUser, async (req, res) => {
  const [workspace, connectors, access] = await Promise.all([
    getWorkspaceByUid(req.currentUser.uid),
    listAccessibleConnectors(req.currentUser),
    getAccessSnapshot({ uid: req.currentUser.uid })
  ]);

  res.json({
    ok: true,
    user: req.currentUser,
    workspace,
    connectors,
    access
  });
});

router.get('/admin/users', requireAuth, attachCurrentUser, requireAdmin, async (req, res) => {
  const directory = await listUsersAndInvites();
  res.json({ ok: true, ...directory });
});

router.post('/admin/users', requireAuth, attachCurrentUser, requireAdmin, async (req, res) => {
  try {
    const result = await upsertInvite(req.body || {}, req.currentUser.uid);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.patch('/admin/users/:uid', requireAuth, attachCurrentUser, requireAdmin, async (req, res) => {
  try {
    const result = await updateUser(req.params.uid, req.body || {});
    res.json({ ok: true, user: result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get('/admin/connectors', requireAuth, attachCurrentUser, requireAdmin, async (req, res) => {
  const connectors = await listConnectors();
  res.json({ ok: true, connectors });
});

router.post('/admin/connectors', requireAuth, attachCurrentUser, requireAdmin, async (req, res) => {
  try {
    const connector = await saveConnector(req.body || {}, req.currentUser.uid);
    res.json({ ok: true, connector });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.patch('/admin/connectors/:connectorId', requireAuth, attachCurrentUser, requireAdmin, async (req, res) => {
  try {
    const connector = await saveConnector({
      ...(req.body || {}),
      id: req.params.connectorId
    }, req.currentUser.uid);
    res.json({ ok: true, connector });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get('/admin/access', requireAuth, attachCurrentUser, requireAdmin, async (req, res) => {
  const snapshot = await getAccessSnapshot({
    uid: req.query.uid,
    email: req.query.email
  });
  res.json({ ok: true, snapshot });
});

router.post('/admin/access/grants', requireAuth, attachCurrentUser, requireAdmin, async (req, res) => {
  try {
    const result = await grantAccess({
      ...req.body,
      grantedBy: req.currentUser.uid
    });
    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post('/admin/access/revoke', requireAuth, attachCurrentUser, requireAdmin, async (req, res) => {
  try {
    const result = await revokeAccess(req.body || {});
    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

module.exports = router;
