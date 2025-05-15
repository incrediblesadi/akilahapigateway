const express = require('express');
const firebaseLogger = require('./logger');

const router = express.Router();

// Mount logger route at /firebase/logger
router.use('/firebase', firebaseLogger);

module.exports = router;
