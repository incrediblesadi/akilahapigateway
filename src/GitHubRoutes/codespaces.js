const express = require('express');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// List active codespaces
router.get('/codespaces', async (req, res) => {
  try {
    const { data } = await octokit.codespaces.listForAuthenticatedUser();
    res.json(
      data.codespaces.map(cs => ({
        id: cs.id,
        name: cs.name,
        state: cs.state,
        created_at: cs.created_at,
        repo: cs.repository.full_name
      }))
    );
  } catch (error) {
    console.error('listCodespaces error:', typeof error === 'object' ? error.message : error);
    res.status(500).json( { error: 'Failed to list codespaces' });
  }
});

// Create a new codespace
router.post('/codespaces/create', async (req, res) => {
  try {
    const { repo, branch, location } = req.body;

    const { data } = await octokit.codespaces.createWithRepo({
      repository_name: repo
     , ref: branch || 'main'
     , location: location || "WestUs2"
    });

    res.json( { status: 'created',
      codespace: data
    });
  } catch (error) {
    console.error('createCodespace error:', error);
    res.status(500).json({ error: 'Failed to create codespace' });
  }
});

module.exports = router;