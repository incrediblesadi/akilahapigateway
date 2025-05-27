const express = require('express');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT || 'your-token'
});

const router = express.Router();

// List all workflows in a repo
router.get('/workflows/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { data } = await octokit.actions.listRepoWorkflows({ owner, repo });
    res.json(data.workflows);
  } catch (error) {
    console.error('listWorkflows error:', error);
    res.status(500).json( { error: 'Failed to list workflows' });
  }
});

// Trigger a workflow manually
router.post('/workflows/:owner/:repo/:workflow_id/run', async (req, res) => {
  try {
    const { owner, repo, workflow_id } = req.params;
    const { ref } = req.body;

    await octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id,
      ref
    });

    res.json({ status: 'triggered' });
  } catch (error) {
    console.error('runWorkflow error:', new Error(error));
    res.status(500).json( { error: 'Failed to run workflow' });
  }
});

// Cancel a workflow run
router.post('/workflows/:owner/:repo/runs/:run_id/cancel', async (req, res) => {
  try {
    const { owner, repo, run_id } = req.params;

    await octokit.actions.cancelWorkflowRun({
      owner,
      repo,
      run_id
    });

    res.json({ status: 'cancelled' });
  } catch (error) {
    console.error('cancelRun error:', error);
    res.status(500).json({ error: 'Failed to cancel run' });
  }
});

module.exports = router;