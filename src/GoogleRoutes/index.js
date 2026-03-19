const express = require('express');
const searchRoutes = require('./search');

const router = express.Router();

// Mount search routes
router.use(searchRoutes);

module.exports = router;
