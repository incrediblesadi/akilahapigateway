const express = require('express');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// List issues for a repository
router.get('/issues/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open'
    });
    res.json(data.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      created_at: issue.created_at,
      user: issue.user.login
    })));
  } catch (error) {
    console.error('listIssues error:', error);
    res.status(500).json({ error: 'Failed to list issues' });
  }
});

// Get details for a specific issue
router.get('/issues/:owner/:repo/:issue_number', async (req, res) => {
  try {
    const { owner, repo, issue_number } = req.params;
    const { data } = await octokit.issues.get({
      owner
     , repo
     , issue_number
    });
    res.json(data);
  } catch (error) {
    console.error('getIssue error:', error);
    res.status(500).json( { error: 'Failed to get issue details' });
  }
});

// Create a new issue
router.post('/issues/:owner/:repo/create', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { title, body } = req.body;
    const { data } = await octokit.issues.create({
      owner
     , repo
     , title
      , body
    });

    res.json( { status: 'created', issue: data });
  } catch (error) {
    console.error('createIssue error:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

module.exports = router;