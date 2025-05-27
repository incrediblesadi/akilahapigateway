const express = require('express');
const notion = require('../sdk/notionClient');

const router = express.Router();

router.post('/create-page', async (req, res) => {
  try {
    const { title, content } = req.body;

    const response = await notion.pages.create({
      parent: {
        type: "page_id",
        page_id: "your-root-page-id"
      },
      properties: {
        title: {
          type: "title",
          title: [
            {
              type: "text",
              text: {
                content: title
              }
            }
          ]
        }
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: { 
                  content: content 
                }
              }
            ]
          }
        }
      ]
    });

    res.status(200).json( { status: 'created', pageId: response.id });
  } catch (error) {
    console.error('Create page error:', new Error(error));
    res.status(500).json( { error: 'Failed to create page' });
  }
});

module.exports = router;