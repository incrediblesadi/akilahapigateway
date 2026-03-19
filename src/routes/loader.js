const express = require('express');
const firebaseLogger = require('./logger');
const notesRoute = require('./notes');
const statusRoute = require('./status');
const authRoutes = require('./auth');
const controlPlaneRoutes = require('./controlPlane');
const dashboardRoutes = require('./dashboard');
const sessionRoutes = require('../session');

// ✅ Add these
const notionRoutes = require('../NotionRoutes');
const githubRoutes = require('../GitHubRoutes');
const linkedinRoutes = require('../LinkedInRoutes');
const googleRoutes = require('../GoogleRoutes');

const router = express.Router();

router.use('/firebase', firebaseLogger);
router.use('/firebase', notesRoute);
router.use(statusRoute);
router.use(authRoutes);
router.use(controlPlaneRoutes);
router.use(dashboardRoutes);
router.use('/session', sessionRoutes);

// ✅ Mount here
router.use('/notion', notionRoutes);
router.use('/', githubRoutes); // or router.use('/github', githubRoutes);
router.use('/linkedin', linkedinRoutes);
router.use('/google', googleRoutes);

module.exports = router;
