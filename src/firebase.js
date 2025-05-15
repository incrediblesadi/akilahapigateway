const admin = require('firebase-admin');

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://sadiworkspace.firebaseio.com'
  });
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('🔥 Firebase init error:', error);
}

const db = admin.database();
module.exports = db;
