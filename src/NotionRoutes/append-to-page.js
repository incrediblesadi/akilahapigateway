const express = require('express');
const notion = require('../sdk/notionClient');

const router = express.Router();

router.post('/append-to-page/:pageId', async (req, res) => {
  try {
    const pageId = req.params.pageId;
    const { content } = req.body;

    const response = await notion.blocks.children.append({
      block_id: pageId,
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content }
              }
            ]
          }
        }
      ]
    });

    res.status(200).json({ status: 'appended', blocks: response.results });
  } catch (error) {
    console.error('Append error:', error);
    res.status(500).json( { error: 'Failed to append to page' });
  }
});

module.exports = router;