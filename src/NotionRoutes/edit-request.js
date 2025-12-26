const express = require('express');
const db = require('../firebase');

const router = express.Router();

router.post('/edit-request', async (req, res) => {
  try {
    const { blockId, proposed, reason } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    await db.ref(`0002SessionNotes/editRequests/${timestamp}`).set({
      blockId,
      proposed,
      reason,
      status: 'pending',
      createdAt: timestamp
    });

    res.status(200).json({ status: 'logged', blockId });
  } catch (error) {
    console.error('Edit request logging error:', new Error(error));
    res.status(500).json({ error: 'Failed to log edit request' });
  }
});

module.exports = router;