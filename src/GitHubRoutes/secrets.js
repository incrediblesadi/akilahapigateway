const express = require('express');
const { Octokit } = require('@octokit/rest');
const sodium = require('tweetsodium');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// List secrets in a repo
router.get('/secrets/:owner/:repo', async (req, res) => {
  try {
  const { owner, repo } = req.params;
  const { data } = await octokit.actions.listRepoSecrets({ owner, repo });
    res.json(data.secrets);
  } catch (error) {
    console.error('listSecrets error:', error);
    res.status(500).json({ error: 'Failed to list secrets' });
  }
});

// Add or update a secret
router.post('/secrets/:owner/:repo/:name', async (req, res) => {
  try {
    const { owner, repo, name } = req.params;
    const { value } = req.body;

    const { data: { key, key_id } } = await octokit.actions.getRepoPublicKey({ owner, repo });

    const messageBytes = Buffer.from(value);
    const keyBytes = Buffer.from(key, 'base64');
    const encryptedBytes = sodium.seal(messageBytes, keyBytes);
    const encrypted_value = Buffer.from(encryptedBytes).toString('base64');

    await octokit.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name: name,
      encrypted_value,
      key_id
    });

    res.json({ status: 'stored', name });
  } catch (error) {
    console.error('addSecret error:', error);
    res.status(500).json({ error: 'Failed to store secret' });
  }
});

// Delete a secret
router.delete('/secrets/:owner/:repo/:name', async (req, res) => {
  try {
    const { owner, repo, name } = req.params;
    await octokit.actions.deleteRepoSecret({ owner, repo, secret_name: name });
    res.json({ status: 'deleted', name });
  } catch (error) {
    console.error('deleteSecret error:', error);
    res.status(500).json( { error: 'Failed to delete secret' });
  }
});

module.exports = router;