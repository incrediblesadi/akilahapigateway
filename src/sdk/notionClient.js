const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN || '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'
});

module.exports = notion;