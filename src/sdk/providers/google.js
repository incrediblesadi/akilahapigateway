const { readEnv } = require('../core/env');

function getGoogleSearchConfig() {
  const apiKey = readEnv('GOOGLE_SEARCH_API_KEY', '');
  const searchEngineId = readEnv('GOOGLE_SEARCH_ENGINE_ID', '');

  return {
    apiKey,
    searchEngineId,
    configured: Boolean(apiKey && searchEngineId)
  };
}

function getGoogleStatus() {
  return { configured: getGoogleSearchConfig().configured };
}

module.exports = { getGoogleSearchConfig, getGoogleStatus };
