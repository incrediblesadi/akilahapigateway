const express = require('express');
const { DateTime } = require('luxon');
const db = require('../firebase');

const router = express.Router();

router.post('/notes', async (req, res) => {
  try {
    const now = DateTime.now().setZone('America/New_York');
    const isoTimestamp = now.toISO();
    const safeTimestamp = isoTimestamp.replace(/[:.]/g, '-');  // sanitize for Firebase

    const payload = req.body;
    const message = typeof payload === 'string' ? payload : payload.note || '';

    const entry = {
      timestamp: isoTimestamp,
      day: now.weekdayLong, 
      date: now.toFormat('dd_MM_yy'),
      time: now.toFormat('hh_mm_a'),
      week_of: now.minus({ days: now.weekday - 1 }).toFormat('yyyy_MM_dd'),
      title: message.split(/(?<=[.!?])\s+/)[0] || 'Untitled Note',
      tags: (payload.tags || []).join(','),
      services: (payload.services || []).join(','),
      sentiment: payload.sentiment || 'neutral',
      note: message
    };

    await db.ref(`0002SessionNotes/${safeTimestamp}`).set(entry);

    res.status(200).send({ status: 'logged', timestamp: isoTimestamp });
  } catch (error) {
    console.error('Note logging error:', error);
    res.status(500).send({ error: 'Failed to log note' });
  }
});

module.exports = router;
