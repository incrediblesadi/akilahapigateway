const express = require('express');
const notion = require('../sdk/notionClient');

const router = express.Router();

router.get('/read-block/:id', async (req, res) => {
  try {
    const blockId = req.params.id;
    const block = await notion.blocks.retrieve({ block_id: blockId });

    res.json({
      id: block.id,
      type: block.type,
      content: block[block.type]?.rich_text || []
    });
  } catch (error) {
    console.error('Block read error:', error);
    res.status(500).json( { error: 'Failed to read block' });
  }
});

module.exports = router;