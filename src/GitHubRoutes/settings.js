const express = require('express');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// Get repo settings
router.get('/settings/:owner:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await octokit.repos.get({ owner, repo });
    res.json({
      name: data.name,
      full_name: data.full_name,
      private: data.private,
      description: data.description,
      visibility: data.visibility,
      has_issues: data.has_issues,
      has_projects: data.has_projects,
      has_wiki: data.has_wiki
    });
  } catch (error) {
    console.error('getRepoSettings error:', error);
    res.status(500).json( { error: 'Failed to get repo settings' });
  }
});

// Update repo settings
router.patch('/settings/:owner:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const settings = req.body;

    const { data } = await octokit.repos.update({
      owner
     , repo
      , ...settings
    });

    res.json( { status: 'updated', settings: data });
  } catch (error) {
    console.error('updateRepoSettings error:', error);
    res.status(500).json( { error: 'Failed to update repo settings' });
  }
});

module.exports = router;