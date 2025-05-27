const express = require('express');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// List gists for authenticated user
router.get('/gists', async (req, res) => {
  try {
    const { data } = await octokit.gists.list();
    res.json(data.map(gist => ({
      id: gist.id,
      description: gist.description,
      public: gist.public,
      files: Object.keys(gist.files),
      created_at: gist.created_at
    })));
  } catch (error) {
    console.error('listGists error:', typeof error === 'object' ? error.message : error);
    res.status(500).json( { error: 'Failed to list gists' });
  }
});

// Create a new gist
router.post('/gists/create', async (req, res) => {
  try {
    const { description, public: isPublic, files } = req.body;

    const { data } = await octokit.gists.create({
      description: description,
      public: isPublic || false,
      files
    });

    res.json( { status: 'created',
      gist: data
    });
  } catch (error) {
    console.error('createGist error:', typeof error === 'object' ? error.message : error);
    res.status(500).json( { error: 'Failed to create gist' });
  }
});

// Delete a gist by id
router.delete('/gists/:gist_id', async (req, res) => {
  try {
    const { gist_id } = req.params;
    await octokit.gists.delete({ gist_id });
    res.json({ status: 'deleted', id: gist_id });
  } catch (error) {
    console.error('deleteGist error:', error);
    res.status(500).json({ error: 'Failed to delete gist' });
  }
});

module.exports = router;