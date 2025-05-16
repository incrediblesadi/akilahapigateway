const express = require('express');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// Read a file
router.get('/files/:owner:repo/:path*()', async (req, res) => {
  try {
    const { owner, repo, path } = req.params;
    const { data } = await octokit.repos.getContent({owner, repo, path });
    const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
    res.json({ name: data.name, content: fileContent });
  } catch (error) {
    console.error('readFile error:', typeof error === 'object' ? error.message : error);
    res.status(500).json( { error: 'Failed to read file' });
  }
});

// Write or update a file
router.put('/files/:owner:repo/:path*()', async (req, res) => {
  try {
    const { owner, repo, path } = req.params;
    const { content, message, sha } = req.body;
    const encoded = Buffer.from(content).toString('base64');

    const result = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: message || 'Update file via GPT',
      content: encoded,
      sha
    });

    res.json({ status: 'written", data: result.data });
  } catch (error) {
    console.error('writeFile error:', typeof error === 'object' ? error.message : error);
    res.status(500).json( { error: 'Failed to write file' });
  }
});

// Delete a file
router.delete('/files/:owner:/repo/:path(())', async (req, res) => {
  try {
    const { owner, repo, path } = req.params;
    const { message, sha } = req.body;

    const result = await octokit.repos.deleteFile({
      owner,
      repo,
      path,
      message: message || 'Delete file via GPT',
      sha
    });

    res.json( { status: 'deleted', data: result.data });
  } catch (error) {
    console.error('deleteFile error:', typeof error === 'object' ? error.message : error);
    res.status(500).json( { error: 'Failed to delete file' });
  }
});

module.exports = router;