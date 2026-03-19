const db = require('../../firebase');
const { readEnv } = require('../core/env');

function getFirebaseDb() {
  return db;
}

function getFirebaseStatus() {
  return {
    configured: Boolean(db),
    databaseURL: readEnv('FIREBASE_DATABASE_URL', 'https://sadiworkspace.firebaseio.com')
  };
}

module.exports = { getFirebaseDb, getFirebaseStatus };
