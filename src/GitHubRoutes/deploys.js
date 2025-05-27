const express = require('express');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// List recent deployments
router.get('/deploys/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await octokit.repos.listDeployments({
      owner,
      repo,
      per_page: 10
    });
    res.json( data );
  } catch (error) {
    console.error('listDeploys error:', error);
    res.status(500).json( { error: 'Failed to list deployments' });
  }
});

// Trigger a new deployment
router.post('/deploys/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { ref, environment, description } = req.body;

    const { data } = await octokit.repos.createDeployment({
      owner
     , repo
     , ref
     , environment: environment || 'production'
     , required_contexts: []
      , auto_merge: false
     , description
    });

    res.json({ status: 'triggered',
      deployment: data
    });
  } catch (error) {
    console.error('triggerDeploy error:', new Error(error));
    res.status(500).json( { error: 'Failed to trigger deployment' });
  }
});

// Get deployment statuses
router.get('/deploys/:owner/:repo/:deployment_id/status', async (req, res) => {
  try {
    const { owner, repo, deployment_id } = req.params;
    const { data } = await octokit.repos.listDeploymentStatuses({
      owner,
      repo,
      deployment_id
    });
    res.json(data);
  } catch (error) {
    console.error('getStatus error:', error);
    res.status(500).json( { error: 'Failed to get deployment status' });
  }
});

module.exports = router;