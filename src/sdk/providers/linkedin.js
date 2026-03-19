const { readEnv } = require('../core/env');

function getLinkedInConfig() {
  const clientId = readEnv('LINKEDIN_CLIENT_ID', '');
  const clientSecret = readEnv('LINKEDIN_CLIENT_SECRET', '');
  const accessToken = readEnv('LINKEDIN_ACCESS_TOKEN', '');
  const redirectUri = readEnv('LINKEDIN_REDIRECT_URI', 'http://localhost:8080/linkedin/auth/callback');

  return {
    clientId,
    clientSecret,
    accessToken,
    redirectUri,
    configured: Boolean(clientId && clientSecret),
    hasToken: Boolean(accessToken)
  };
}

function getLinkedInStatus() {
  const config = getLinkedInConfig();
  return { configured: config.configured, hasToken: config.hasToken };
}

module.exports = { getLinkedInConfig, getLinkedInStatus };
