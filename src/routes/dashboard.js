const fs = require('fs');
const path = require('path');
const express = require('express');
const { requireAuth } = require('../auth/session');
const buildCurrentSession = require('../session/buildCurrentSession');
const {
  DEFAULT_STAGE_FLOW,
  getUserByUid,
  getWorkspaceByUid,
  listAccessibleConnectors
} = require('../sdk/dynamicRegistry');

const router = express.Router();
const CURRENT_SESSION_PATH = path.join(__dirname, '..', 'session', 'currentSession.json');

function readCurrentSession() {
  if (!fs.existsSync(CURRENT_SESSION_PATH)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(CURRENT_SESSION_PATH, 'utf8'));
  } catch (error) {
    return {
      sessionId: 'session-unavailable',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

function summarizeSession(session) {
  if (!session) {
    return {
      id: 'session-not-built',
      timestamp: null,
      notionPages: 0,
      githubRepos: 0,
      firebasePaths: 0,
      tools: 0
    };
  }

  return {
    id: session.sessionId || 'session-unknown',
    timestamp: session.timestamp || null,
    notionPages: session.services?.notion?.pages?.length || 0,
    githubRepos: session.services?.github?.repos?.length || 0,
    firebasePaths: session.services?.firebase?.paths?.length || 0,
    tools: session.tools?.length || 0,
    selectedNotionPage: session.services?.notion?.selectedPage || null,
    selectedPath: session.services?.firebase?.selectedPath || null,
    nextAction: session.annotations?.nextAction || ''
  };
}

function getGatewayUrl(req) {
  return readEnvLike(req, 'GATEWAY_PUBLIC_URL')
    || `${req.protocol}://${req.get('host')}`;
}

function readEnvLike(req, name) {
  if (typeof process.env[name] === 'string' && process.env[name].trim()) {
    return process.env[name].trim();
  }
  return '';
}

function buildServiceCards(req, connectors) {
  const gatewayUrl = getGatewayUrl(req);
  const services = {
    gateway: {
      label: 'Akilah API Gateway',
      status: 'configured',
      url: gatewayUrl
    }
  };

  connectors.forEach((connector) => {
    services[connector.id] = {
      label: connector.label,
      provider: connector.provider,
      status: connector.runtimeStatus || connector.status || 'unknown',
      accessRole: connector.accessRole,
      url: connector.description || '',
      detail: `${connector.connectionMode} access`
    };
  });

  return services;
}

function buildWorkspaceContainers(summary, services, user, workspace, connectors) {
  const panels = Array.isArray(workspace?.panels) ? workspace.panels : ['session', 'connectors', 'services'];
  const stageFlow = Array.isArray(workspace?.stageFlow) && workspace.stageFlow.length
    ? workspace.stageFlow
    : DEFAULT_STAGE_FLOW;
  const containers = [];

  if (panels.includes('session')) {
    containers.push({
      id: 'session',
      title: 'Session',
      items: [
        { label: 'session_id', value: summary.id },
        { label: 'updated_at', value: summary.timestamp || 'not built yet' },
        { label: 'next_action', value: summary.nextAction || 'define next action' }
      ]
    });

    containers.push({
      id: 'staging',
      title: 'Staging Flow',
      items: stageFlow.map((stage, index) => ({
        label: `0${index + 1}`,
        value: stage
      }))
    });
  }

  if (panels.includes('connectors')) {
    containers.push({
      id: 'connectors',
      title: 'Connectors',
      items: connectors.length
        ? connectors.map((connector) => ({
          label: connector.label,
          value: connector.accessRole,
          detail: `${connector.provider} · ${connector.connectionMode}`
        }))
        : [{ label: 'connectors', value: 'none', detail: 'no connectors granted yet' }]
    });
  }

  if (panels.includes('services')) {
    containers.push({
      id: 'services',
      title: 'Services',
      items: Object.entries(services).map(([key, value]) => ({
        label: key,
        value: value.status,
        detail: value.url || value.detail || value.label
      }))
    });
  }

  if (panels.includes('users') || panels.includes('access')) {
    containers.push({
      id: 'admin',
      title: 'Admin',
      items: [
        { label: 'role', value: user.role, detail: 'current dashboard permissions' },
        { label: 'users', value: 'manage', detail: 'create users and invites' },
        { label: 'access', value: 'grant', detail: 'assign shared connectors and views' }
      ]
    });
  }

  return containers;
}

async function maybeRefreshSession(req) {
  if (req.query.refresh !== '1') {
    return null;
  }

  try {
    await buildCurrentSession();
    return null;
  } catch (error) {
    return error.message;
  }
}

router.get('/dashboard/bootstrap', requireAuth, async (req, res) => {
  const refreshError = await maybeRefreshSession(req);
  const session = readCurrentSession();
  const user = await getUserByUid(req.user.uid || `google_${req.user.sub}`);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'User record not found' });
  }
  const workspace = await getWorkspaceByUid(user.uid);
  const connectors = await listAccessibleConnectors(user);
  const sessionSummary = summarizeSession(session);
  const services = buildServiceCards(req, connectors);
  const stageFlow = Array.isArray(workspace?.stageFlow) && workspace.stageFlow.length
    ? workspace.stageFlow
    : DEFAULT_STAGE_FLOW;

  res.json({
    ok: true,
    user,
    app: {
      name: 'Akilah',
      mode: 'dashboard',
      gatewayUrl: getGatewayUrl(req)
    },
    layout: {
      header: true,
      mainContainer: 'workspace',
      animationContainer: 'ambient-grid'
    },
    session: {
      summary: sessionSummary,
      data: session
    },
    connectors,
    services,
    workspace: {
      ...(workspace || {}),
      containers: buildWorkspaceContainers(sessionSummary, services, user, workspace, connectors)
    },
    stageFlow,
    refresh: refreshError ? { ok: false, error: refreshError } : { ok: true }
  });
});

router.get('/dashboard/session', requireAuth, async (req, res) => {
  const refreshError = await maybeRefreshSession(req);
  const session = readCurrentSession();
  const user = await getUserByUid(req.user.uid || `google_${req.user.sub}`);

  res.json({
    ok: true,
    user,
    refresh: refreshError ? { ok: false, error: refreshError } : { ok: true },
    summary: summarizeSession(session),
    session
  });
});

router.get('/dashboard/services', requireAuth, async (req, res) => {
  const user = await getUserByUid(req.user.uid || `google_${req.user.sub}`);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'User record not found' });
  }
  const connectors = await listAccessibleConnectors(user);

  res.json({
    ok: true,
    user,
    connectors,
    services: buildServiceCards(req, connectors)
  });
});

module.exports = router;
