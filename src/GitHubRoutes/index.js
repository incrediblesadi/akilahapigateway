const express = require('express');

const repos = require('./repos');
const issues = require('./issues');
const files = require('./files');
const deploys = require('./deploys');
const workflows = require('./workflows');
const gists = require('./gists');
const secrets = require('./secrets');
const codespaces = require('./codespaces');
const hooks = require('./hooks');
const settings = require('./settings');

const router = express.Router();

// Mount all GitHub routes under a shared prefix.
router.use('/github', repos);
router.use('/github', issues);
router.use('/github', files);
router.use('/github', deploys);
router.use('/github', workflows);
router.use('/github', gists);
router.use('/github', secrets);
router.use('/github', codespaces);
router.use('/github', hooks);
router.use('/github', settings);

module.exports = router;
