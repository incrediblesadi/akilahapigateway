const express = require('express');
const { DateTime } = require('luxon');
const db = require('../../firebase');

const router = express.Router();

router.post('/logger', async (req, res) => {
  try {
    const nowEastern = DateTime.now().setZone('America/New_York').toISO();
    const logPath = `0001currentsession/99serverlogs/${nowEastern}`;

    const result = req.body.result || 'No result provided';

    await db.ref(logPath).set(result);

    res.status(200).send({ status: 'logged', timestamp: nowEastern, path: logPath });
  } catch (error) {
    console.error('Firebase logging error:', error);
    res.status(500).send({ error: 'Failed to write to Firebase' });
  }
});

module.exports = router;
