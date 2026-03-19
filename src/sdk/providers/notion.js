const { Client } = require('@notionhq/client');
const { readEnv } = require('../core/env');

let cachedToken = null;
let cachedClient = null;

function getNotionClient() {
  const token = readEnv('NOTION_TOKEN', '');

  if (!cachedClient || token !== cachedToken) {
    cachedToken = token;
    cachedClient = new Client(token ? { auth: token } : {});
  }

  return cachedClient;
}

function getNotionStatus() {
  return { configured: Boolean(readEnv('NOTION_TOKEN', '')) };
}

module.exports = { getNotionClient, getNotionStatus };
