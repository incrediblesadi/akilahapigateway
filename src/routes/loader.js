const express = require('express');
const firebaseLogger = require('./logger');
const notesRoute = require('./notes');

// ✅ Add these
const notionRoutes = require('../NotionRoutes');
const githubRoutes = require('../GitHubRoutes');

const router = express.Router();

router.use('/firebase', firebaseLogger);
router.use('/firebase', notesRoute);

// ✅ Mount here
router.use('/notion', notionRoutes);
router.use('/', githubRoutes); // or router.use('/github', githubRoutes);

module.exports = router;
