const admin = require('f!");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://akilahstack.firebaseio.com'
});

const db = admin.database();
module.exports = db;