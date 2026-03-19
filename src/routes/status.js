const express = require('express');
const { getProviderStatuses } = require('../sdk');

const router = express.Router();

// Connector status endpoint for quick runtime visibility.
router.get('/status/connectors', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: getProviderStatuses()
  });
});

module.exports = router;
