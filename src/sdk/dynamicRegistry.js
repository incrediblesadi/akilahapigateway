const { getFirebaseDb, getProviderStatuses } = require('./index');
const { readEnv } = require('./core/env');

const ROOTS = {
  users: 'users',
  workspaces: 'workspaces',
  connectors: 'connectors',
  access: 'access',
  invites: 'userInvites',
  pendingAccess: 'pendingAccess',
  byEmail: 'userIndex/byEmail'
};

const DEFAULT_STAGE_FLOW = [
  'intake',
  'deconstruction',
  'clarification',
  'insight',
  'to-do'
];

const DEFAULT_ADMIN_EMAILS = ['google@akilah.io'];

const DEFAULT_CONNECTORS = [
  {
    id: 'shared_firebase_rtdb',
    provider: 'firebase',
    label: 'Firebase RTDB',
    ownerType: 'org',
    ownerId: 'akilah',
    visibility: 'shared',
    connectionMode: 'shared',
    status: 'active',
    capabilities: ['read', 'write', 'notes', 'logger', 'sessions'],
    views: ['session', 'notes', 'rtdb'],
    description: 'Shared Realtime Database workspace state'
  },
  {
    id: 'shared_gcs',
    provider: 'gcs',
    label: 'Google Cloud Storage',
    ownerType: 'org',
    ownerId: 'akilah',
    visibility: 'shared',
    connectionMode: 'shared',
    status: 'active',
    capabilities: ['buckets', 'objects', 'uploads'],
    views: ['files', 'storage'],
    description: 'Shared object storage and file views'
  },
  {
    id: 'shared_google_workspace',
    provider: 'google_workspace',
    label: 'Google Workspace',
    ownerType: 'org',
    ownerId: 'akilah',
    visibility: 'shared',
    connectionMode: 'shared',
    status: 'active',
    capabilities: ['search', 'drive', 'docs', 'gmail'],
    views: ['workspace', 'search'],
    description: 'Shared Google Workspace bridge'
  },
  {
    id: 'shared_aws',
    provider: 'aws',
    label: 'AWS',
    ownerType: 'org',
    ownerId: 'akilah',
    visibility: 'shared',
    connectionMode: 'shared',
    status: 'active',
    capabilities: ['s3', 'secrets', 'lambda'],
    views: ['cloud', 'storage'],
    description: 'Shared AWS cloud operations'
  },
  {
    id: 'shared_linkedin',
    provider: 'linkedin',
    label: 'LinkedIn',
    ownerType: 'org',
    ownerId: 'akilah',
    visibility: 'shared',
    connectionMode: 'shared',
    status: 'active',
    capabilities: ['profile', 'connections', 'share'],
    views: ['social', 'outreach'],
    description: 'LinkedIn organization/social connector'
  },
  {
    id: 'shared_notion',
    provider: 'notion',
    label: 'Notion',
    ownerType: 'org',
    ownerId: 'akilah',
    visibility: 'shared',
    connectionMode: 'shared',
    status: 'active',
    capabilities: ['pages', 'blocks', 'edit'],
    views: ['documents', 'knowledge'],
    description: 'Shared Notion workspace connector'
  },
  {
    id: 'shared_github',
    provider: 'github',
    label: 'GitHub',
    ownerType: 'org',
    ownerId: 'akilah',
    visibility: 'shared',
    connectionMode: 'shared',
    status: 'active',
    capabilities: ['repos', 'issues', 'workflows', 'files'],
    views: ['repos', 'delivery'],
    description: 'Shared source-control connector'
  }
];

function getDbOrThrow() {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not configured for the dynamic registry');
  }
  return db;
}

function nowIso() {
  return new Date().toISOString();
}

function sanitizeKey(value) {
  return String(value || '')
    .trim()
    .replace(/[.#$/\[\]\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'item';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function emailKey(email) {
  return sanitizeKey(normalizeEmail(email));
}

function defaultPanelsForRole(role) {
  if (role === 'admin') {
    return ['session', 'connectors', 'services', 'users', 'access'];
  }

  return ['session', 'connectors', 'services'];
}

function buildWorkspaceSeed(uid, role, overrides = {}) {
  return {
    uid,
    panels: Array.isArray(overrides.panels) && overrides.panels.length
      ? overrides.panels
      : defaultPanelsForRole(role),
    stageFlow: Array.isArray(overrides.stageFlow) && overrides.stageFlow.length
      ? overrides.stageFlow
      : DEFAULT_STAGE_FLOW,
    layout: overrides.layout || 'default',
    preferences: overrides.preferences || {}
  };
}

async function readPath(path) {
  const snapshot = await getDbOrThrow().ref(path).get();
  return snapshot.exists() ? snapshot.val() : null;
}

async function writePath(path, value) {
  await getDbOrThrow().ref(path).set(value);
  return value;
}

async function updatePath(path, value) {
  await getDbOrThrow().ref(path).update(value);
}

async function removePath(path) {
  await getDbOrThrow().ref(path).remove();
}

async function countUsers() {
  const users = await readPath(ROOTS.users);
  return users ? Object.keys(users).length : 0;
}

function getAdminEmails() {
  const configured = readEnv('AKILAH_ADMIN_EMAILS', '') || readEnv('ADMIN_EMAILS', '');
  const values = configured
    ? configured.split(',').map((entry) => normalizeEmail(entry)).filter(Boolean)
    : [];

  return Array.from(new Set([...DEFAULT_ADMIN_EMAILS, ...values]));
}

function isAdminEmail(email) {
  return getAdminEmails().includes(normalizeEmail(email));
}

async function ensureDefaultConnectors() {
  for (const connector of DEFAULT_CONNECTORS) {
    const existing = await readPath(`${ROOTS.connectors}/${connector.id}`);
    if (existing) continue;

    const timestamp = nowIso();
    await writePath(`${ROOTS.connectors}/${connector.id}`, {
      ...connector,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: 'system',
      managed: true
    });
  }
}

async function getWorkspaceByUid(uid) {
  return readPath(`${ROOTS.workspaces}/${uid}`);
}

async function ensureWorkspaceByUid(uid, role, overrides = {}) {
  const existing = await getWorkspaceByUid(uid);
  const timestamp = nowIso();

  if (existing) {
    const next = {
      ...existing,
      ...(overrides || {}),
      uid,
      panels: Array.isArray(overrides.panels) && overrides.panels.length
        ? overrides.panels
        : (Array.isArray(existing.panels) && existing.panels.length
          ? existing.panels
          : defaultPanelsForRole(role)),
      stageFlow: Array.isArray(overrides.stageFlow) && overrides.stageFlow.length
        ? overrides.stageFlow
        : (Array.isArray(existing.stageFlow) && existing.stageFlow.length
          ? existing.stageFlow
          : DEFAULT_STAGE_FLOW),
      updatedAt: timestamp
    };

    await writePath(`${ROOTS.workspaces}/${uid}`, next);
    return next;
  }

  const created = {
    ...buildWorkspaceSeed(uid, role, overrides),
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await writePath(`${ROOTS.workspaces}/${uid}`, created);
  return created;
}

async function getUserByUid(uid) {
  if (!uid) return null;
  return readPath(`${ROOTS.users}/${uid}`);
}

async function getUidByEmail(email) {
  const key = emailKey(email);
  if (!key) return null;
  return readPath(`${ROOTS.byEmail}/${key}`);
}

async function getUserByEmail(email) {
  const uid = await getUidByEmail(email);
  return uid ? getUserByUid(uid) : null;
}

async function getInviteByEmail(email) {
  const key = emailKey(email);
  if (!key) return null;
  return readPath(`${ROOTS.invites}/${key}`);
}

async function listUsers() {
  const users = await readPath(ROOTS.users);
  const values = Object.values(users || {});
  return values.sort((left, right) => (left.email || left.uid).localeCompare(right.email || right.uid));
}

async function listInvites() {
  const invites = await readPath(ROOTS.invites);
  const values = Object.values(invites || {});
  return values.sort((left, right) => (left.email || '').localeCompare(right.email || ''));
}

async function listConnectors() {
  await ensureDefaultConnectors();
  const connectors = await readPath(ROOTS.connectors);
  const values = Object.values(connectors || {});
  return values.sort((left, right) => (left.label || left.id).localeCompare(right.label || right.id));
}

function normalizeArray(values) {
  return Array.isArray(values)
    ? Array.from(new Set(values.map((value) => String(value).trim()).filter(Boolean)))
    : [];
}

async function saveConnector(payload, actorUid) {
  await ensureDefaultConnectors();
  const existing = payload.id
    ? await readPath(`${ROOTS.connectors}/${sanitizeKey(payload.id)}`)
    : null;
  const connectorId = sanitizeKey(payload.id || `${payload.provider || 'connector'}_${payload.label || nowIso()}`);
  const timestamp = nowIso();

  const next = {
    ...existing,
    id: connectorId,
    provider: String(payload.provider || existing?.provider || 'custom').trim(),
    label: String(payload.label || existing?.label || connectorId).trim(),
    ownerType: String(payload.ownerType || existing?.ownerType || 'org').trim(),
    ownerId: String(payload.ownerId || existing?.ownerId || (payload.ownerType === 'user' ? actorUid : 'akilah')).trim(),
    visibility: String(payload.visibility || existing?.visibility || 'shared').trim(),
    connectionMode: String(payload.connectionMode || existing?.connectionMode || 'shared').trim(),
    status: String(payload.status || existing?.status || 'active').trim(),
    scopes: normalizeArray(payload.scopes ?? existing?.scopes),
    capabilities: normalizeArray(payload.capabilities ?? existing?.capabilities),
    views: normalizeArray(payload.views ?? existing?.views),
    description: String(payload.description || existing?.description || '').trim(),
    secretRef: String(payload.secretRef || existing?.secretRef || '').trim(),
    config: payload.config || existing?.config || {},
    managed: Boolean(existing?.managed && payload.managed !== false),
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
    createdBy: existing?.createdBy || actorUid || 'system'
  };

  await writePath(`${ROOTS.connectors}/${connectorId}`, next);
  return next;
}

async function upsertInvite({ email, role, status, displayName, workspace }, actorUid) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('email is required');
  }

  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    return updateUser(existingUser.uid, {
      role,
      status,
      name: displayName || existingUser.name,
      workspace
    });
  }

  const key = emailKey(normalizedEmail);
  const existingInvite = await readPath(`${ROOTS.invites}/${key}`);
  const timestamp = nowIso();
  const next = {
    ...existingInvite,
    email: normalizedEmail,
    role: role || existingInvite?.role || 'member',
    status: status || existingInvite?.status || 'active',
    displayName: displayName || existingInvite?.displayName || normalizedEmail,
    workspace: workspace || existingInvite?.workspace || {},
    createdAt: existingInvite?.createdAt || timestamp,
    updatedAt: timestamp,
    invitedBy: actorUid
  };

  await writePath(`${ROOTS.invites}/${key}`, next);
  return { type: 'invite', invite: next };
}

async function grantAccessToUser({ uid, connectorId, grantedBy, role = 'viewer', permissions = [], views = [] }) {
  const user = await getUserByUid(uid);
  if (!user) {
    throw new Error(`user not found: ${uid}`);
  }

  const connector = await readPath(`${ROOTS.connectors}/${connectorId}`);
  if (!connector) {
    throw new Error(`connector not found: ${connectorId}`);
  }

  const timestamp = nowIso();
  const existing = await readPath(`${ROOTS.access}/${uid}/${connectorId}`);
  const next = {
    ...existing,
    uid,
    connectorId,
    role,
    permissions: normalizeArray(permissions),
    views: normalizeArray(views),
    status: 'active',
    grantedBy,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp
  };

  await writePath(`${ROOTS.access}/${uid}/${connectorId}`, next);
  return next;
}

async function grantPendingAccess({ email, connectorId, grantedBy, role = 'viewer', permissions = [], views = [] }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error('email is required when uid is not provided');
  }

  const connector = await readPath(`${ROOTS.connectors}/${connectorId}`);
  if (!connector) {
    throw new Error(`connector not found: ${connectorId}`);
  }

  const key = emailKey(normalizedEmail);
  const timestamp = nowIso();
  const existing = await readPath(`${ROOTS.pendingAccess}/${key}/${connectorId}`);
  const next = {
    ...existing,
    email: normalizedEmail,
    connectorId,
    role,
    permissions: normalizeArray(permissions),
    views: normalizeArray(views),
    status: 'pending',
    grantedBy,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp
  };

  await writePath(`${ROOTS.pendingAccess}/${key}/${connectorId}`, next);
  return next;
}

async function grantAccess({ uid, email, connectorId, grantedBy, role, permissions, views }) {
  if (uid) {
    return { type: 'user', grant: await grantAccessToUser({ uid, connectorId, grantedBy, role, permissions, views }) };
  }

  const existingUser = email ? await getUserByEmail(email) : null;
  if (existingUser) {
    return { type: 'user', grant: await grantAccessToUser({ uid: existingUser.uid, connectorId, grantedBy, role, permissions, views }) };
  }

  return { type: 'pending', grant: await grantPendingAccess({ email, connectorId, grantedBy, role, permissions, views }) };
}

async function revokeAccess({ uid, email, connectorId }) {
  if (uid) {
    await removePath(`${ROOTS.access}/${uid}/${connectorId}`);
    return { type: 'user', connectorId, uid };
  }

  const existingUser = email ? await getUserByEmail(email) : null;
  if (existingUser) {
    await removePath(`${ROOTS.access}/${existingUser.uid}/${connectorId}`);
    return { type: 'user', connectorId, uid: existingUser.uid };
  }

  await removePath(`${ROOTS.pendingAccess}/${emailKey(email)}/${connectorId}`);
  return { type: 'pending', connectorId, email: normalizeEmail(email) };
}

async function listAccessForUid(uid) {
  return readPath(`${ROOTS.access}/${uid}`) || {};
}

async function listPendingAccessByEmail(email) {
  return readPath(`${ROOTS.pendingAccess}/${emailKey(email)}`) || {};
}

async function claimPendingAccess(email, uid, grantedBy) {
  const pending = await listPendingAccessByEmail(email);
  const entries = Object.values(pending || {});

  for (const grant of entries) {
    await grantAccessToUser({
      uid,
      connectorId: grant.connectorId,
      grantedBy: grant.grantedBy || grantedBy || uid,
      role: grant.role,
      permissions: grant.permissions,
      views: grant.views
    });
  }

  if (entries.length) {
    await removePath(`${ROOTS.pendingAccess}/${emailKey(email)}`);
  }
}

async function grantAdminBaseline(uid) {
  const connectors = await listConnectors();

  for (const connector of connectors) {
    await grantAccessToUser({
      uid,
      connectorId: connector.id,
      grantedBy: uid,
      role: 'admin',
      permissions: connector.capabilities || [],
      views: connector.views || []
    });
  }
}

async function ensureUserRecord(profile) {
  await ensureDefaultConnectors();

  const uid = sanitizeKey(profile.uid || `google_${profile.sub}`);
  const email = normalizeEmail(profile.email);
  const existing = await getUserByUid(uid);
  const invite = email ? await getInviteByEmail(email) : null;
  const userCount = existing ? 1 : await countUsers();
  const isBootstrapAdmin = !existing && userCount === 0;
  const role = existing?.role || invite?.role || (isAdminEmail(email) || isBootstrapAdmin ? 'admin' : 'member');
  const status = existing?.status || invite?.status || 'active';
  const timestamp = nowIso();

  const next = {
    ...existing,
    uid,
    sub: profile.sub,
    email,
    name: profile.name || existing?.name || invite?.displayName || email,
    picture: profile.picture || existing?.picture || '',
    provider: 'google',
    role,
    status,
    workspaceId: existing?.workspaceId || uid,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
    lastLoginAt: timestamp
  };

  await writePath(`${ROOTS.users}/${uid}`, next);
  if (email) {
    await writePath(`${ROOTS.byEmail}/${emailKey(email)}`, uid);
  }

  const workspace = await ensureWorkspaceByUid(uid, role, invite?.workspace || {});

  if (role === 'admin') {
    await grantAdminBaseline(uid);
  }

  if (email) {
    await claimPendingAccess(email, uid, uid);
  }

  if (invite) {
    await updatePath(`${ROOTS.invites}/${emailKey(email)}`, {
      claimedUid: uid,
      claimedAt: timestamp,
      updatedAt: timestamp
    });
  }

  return {
    ...next,
    workspace
  };
}

async function updateUser(uid, patch = {}) {
  const existing = await getUserByUid(uid);
  if (!existing) {
    throw new Error(`user not found: ${uid}`);
  }

  const timestamp = nowIso();
  const next = {
    ...existing,
    ...(patch.name ? { name: patch.name } : {}),
    ...(patch.picture ? { picture: patch.picture } : {}),
    ...(patch.role ? { role: patch.role } : {}),
    ...(patch.status ? { status: patch.status } : {}),
    updatedAt: timestamp
  };

  await writePath(`${ROOTS.users}/${uid}`, next);
  const workspace = patch.workspace
    ? await ensureWorkspaceByUid(uid, next.role, patch.workspace)
    : await ensureWorkspaceByUid(uid, next.role);

  return {
    ...next,
    workspace
  };
}

function connectorRuntimeStatus(connector, providerStatuses) {
  switch (connector.provider) {
    case 'firebase':
      return providerStatuses.firebase?.configured ? 'configured' : 'missing';
    case 'github':
      return providerStatuses.github?.configured ? 'configured' : 'missing';
    case 'notion':
      return providerStatuses.notion?.configured ? 'configured' : 'missing';
    case 'linkedin':
      return providerStatuses.linkedin?.configured ? 'configured' : 'missing';
    case 'google':
    case 'google_workspace':
    case 'gcs':
      return providerStatuses.google?.configured ? 'configured' : 'available';
    case 'aws':
      return 'available';
    default:
      return connector.status || 'unknown';
  }
}

async function listAccessibleConnectors(user) {
  const connectors = await listConnectors();
  const grants = await listAccessForUid(user.uid);
  const providerStatuses = getProviderStatuses();

  return connectors
    .filter((connector) => {
      if (user.role === 'admin') return true;
      if (connector.ownerType === 'user' && connector.ownerId === user.uid) return true;
      if (connector.visibility === 'public') return true;
      return grants?.[connector.id]?.status === 'active';
    })
    .map((connector) => {
      const grant = grants?.[connector.id] || null;
      return {
        ...connector,
        runtimeStatus: connectorRuntimeStatus(connector, providerStatuses),
        accessRole: user.role === 'admin'
          ? (grant?.role || 'admin')
          : (grant?.role || (connector.ownerId === user.uid ? 'owner' : 'viewer')),
        permissions: normalizeArray(grant?.permissions || connector.capabilities),
        grantedViews: normalizeArray(grant?.views || connector.views)
      };
    });
}

async function getAccessSnapshot({ uid, email }) {
  const actualUser = uid ? await getUserByUid(uid) : (email ? await getUserByEmail(email) : null);

  if (actualUser) {
    return {
      type: 'user',
      user: actualUser,
      access: await listAccessForUid(actualUser.uid)
    };
  }

  if (!email) {
    return { type: 'none', access: {} };
  }

  return {
    type: 'invite',
    email: normalizeEmail(email),
    access: await listPendingAccessByEmail(email)
  };
}

async function listUsersAndInvites() {
  const [users, invites] = await Promise.all([listUsers(), listInvites()]);
  return { users, invites };
}

module.exports = {
  DEFAULT_STAGE_FLOW,
  ensureDefaultConnectors,
  ensureUserRecord,
  getAccessSnapshot,
  getUserByEmail,
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
};
