const admin = require('firebase-admin');

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://sadiworkspace.firebaseio.com'
  });
} catch (e) {
  console.error('Firebase init error:', e);
}

const db = admin.database();
module.exports = db;
