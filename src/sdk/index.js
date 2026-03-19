const { getGitHubClient, getGitHubStatus } = require('./providers/github');
const { getNotionClient, getNotionStatus } = require('./providers/notion');
const { getGoogleSearchConfig, getGoogleStatus } = require('./providers/google');
const { getLinkedInConfig, getLinkedInStatus } = require('./providers/linkedin');
const { getFirebaseDb, getFirebaseStatus } = require('./providers/firebase');

function getProviderStatuses() {
  return {
    github: getGitHubStatus(),
    notion: getNotionStatus(),
    google: getGoogleStatus(),
    linkedin: getLinkedInStatus(),
    firebase: getFirebaseStatus()
  };
}

module.exports = {
  getGitHubClient,
  getNotionClient,
  getGoogleSearchConfig,
  getLinkedInConfig,
  getFirebaseDb,
  getProviderStatuses
};
