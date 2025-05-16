const express = require('express');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// List all accessible repos
router.get('/repos', async (req, res) => {
  try {
    const response = await octokit.repos.listForAuthenticatedUser({ per_page: 100 });
    res.json(response.data.map(repo => ({
      name: repo.name,
      owner: repo.owner.login,
      private: repo.private,
      description: repo.description
    })));
  } catch (error) {
    console.error('listRepos error:', typeof error === 'object' ? error.message : error);
    res.status(500).json( { error: 'Unable to list repositories' });
  }
});

// Get metadata for a specific repo
router.get('/repos/:owner:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await octokit.repos.get({ owner, repo });
    res.json(data);
  } catch (error) {
    console.error('getRepoDetails error:', error);
    res.status(500).json({ error: 'Failed to get repo details' });
  }
});

// Create a new repo
router.post('/repos/create', async (req, res) => {
  try {
    const { name, description, private } = req.body;
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      description,
      private: private || false
    });
    res.json({ status: 'created', repo: data });
  } catch (error) {
    console.error('createRepo error:', error);
    res.status(500).json( { error: 'Failed to create repository' });
  }
});

module.exports = router;