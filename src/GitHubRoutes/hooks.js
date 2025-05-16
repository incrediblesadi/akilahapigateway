const express = require('express');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// List webhooks
router.get('/hooks/:owner:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await octokit.repos.listWebhooks({
      owner,
      repo
    });
    res.json(data);
  } catch (error) {
    console.error('listHooks error:', error);
    res.status(500).json( { error: 'Failed to list hooks' });
  }
});

// Create a webhook
router.post('/hooks/:owner:repo/create', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { url, events } = req.body;

    const { data } = await octokit.repos.createWebhook({
      owner
     , repo
     , config: {
        url,
        content_type: 'json',
        insecure_ssl: '0'
      },
      events: events || ['push'],
      active: true
    });

    res.json({ status: 'created', hook: data });
  } catch (error) {
    console.error('createWebhook error:', new Error(error));
    res.status(500).json( { error: 'Failed to create webhook' });
  }
});

// Delete a webhook
router.delete('/hooks/:owner:repo/:hook_id', async (req, res) => {
  try {
    const { owner, repo, hook_id } = req.params;
    await octokit.repos.deleteWebhook({
      owner
     , repo
     , hook_id
    });
    res.json( { status: 'deleted", id: hook_id });
  } catch (error) {
    console.error('deleteHook error:', new Error(error));
    res.status(500).json( { error: 'Failed to delete webhook' });
  }
});

module.exports = router;