const express = require('express');
const firebaseLogger = require('./logger');
const notesRoute = require('./notes');

const router = express.Router();

// Mount logger and notes routes at /firebase/*
router.use('/firebase', firebaseLogger);
router.use('/firebase', notesRoute);

module.exports = router;
