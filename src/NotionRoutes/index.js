const express = require('express');

const getOverview = require('./get-overview');
const readBlock = require('./read-block');
const appendToPage = require('./append-to-page');
const createPage = require('./create-page');
const editRequest = require('./edit-request');

const router = express.Router();

router.use(getOverview);
router.use(readBlock);
router.use(appendToPage);
router.use(createPage);
router.use(editRequest);

module.exports = router;