const express = require('express');
const notion = require('../sdk/notionClient');
const notionPages = require('./notionPages');

const router = express.Router();

router.get('/get-overview', async (req, res) => {
  try {
    const results = [];

    for (const page of notionPages) {
      const blocksRes = await notion.blocks.children.list({
        block_id: page.id,
        page_size: 10
      });

      results.push({
        id: page.id,
        title: page.label,
        blockTypes: blocksRes.results.map(n => n.type),
        blocks: blocksRes.results.map(b => ({ id: b.id, type: b.type, text: b[b.type]?.rich_text?.[0]?.plain_text || '' }))
    });
  }

    res.json({ pages: results });
  } catch (error) {
    console.error('Overview fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Notion overview' });
  }
});

module.exports = router;