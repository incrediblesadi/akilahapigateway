const express = require('express');
const firebaseLogger = require('./logger');

const router = express.Router();

// Mount Firebase-related routes
router.use('/firebase', firebaseLogger);

// Add other routes here later

module.exports = router;
