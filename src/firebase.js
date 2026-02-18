const admin = require('firebase-admin');

let db = null;

try {
  // Only initialize Firebase if credentials are available
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: 'https://sadiworkspace.firebaseio.com'
    });
    db = admin.database();
    console.log('✅ Firebase initialized');
  } else {
    console.log('⚠️ Firebase credentials not found - Firebase features disabled');
  }
} catch (error) {
  console.error('🔥 Firebase init error:', error.message);
  console.log('⚠️ Firebase features will be disabled');
}

module.exports = db;
