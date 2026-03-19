const { Octokit } = require('@octokit/rest');
const { readEnv } = require('../core/env');

let cachedToken = null;
let cachedClient = null;

function getGitHubClient() {
  const token = readEnv('GITHUB_PAT', '');

  if (!cachedClient || token !== cachedToken) {
    cachedToken = token;
    cachedClient = token ? new Octokit({ auth: token }) : new Octokit();
  }

  return cachedClient;
}

function getGitHubStatus() {
  return { configured: Boolean(readEnv('GITHUB_PAT', '')) };
}

module.exports = { getGitHubClient, getGitHubStatus };
