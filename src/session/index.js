const express = require('express');
const rebuildRoute = require('./rebuild');

const router = express.Router();

// Mount rebuild route
router.use('/', rebuildRoute);

module.exports = router;