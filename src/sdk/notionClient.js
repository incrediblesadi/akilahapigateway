const { Client } = require('@notionhq/client');

// Validate that NOTION_TOKEN environment variable is set
if (!process.env.NOTION_TOKEN) {
  throw new Error('NOTION_TOKEN environment variable is required but not set');
}

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

module.exports = notion;