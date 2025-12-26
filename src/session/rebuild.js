const express = require('express');
const buildCurrentSession = require('./buildCurrentSession');

const router = express.Router();

router.post('/rebuild', async (req, res) => {
  try {
    await buildCurrentSession();
    res.status(200).json( { message: 'Session rebuilt successfully' });
  } catch (error) {
    console.error('Session rebuild error:', error.message);
    res.status(500).json({ error: 'Failed to rebuild session' });
  }
});

module.exports = router;