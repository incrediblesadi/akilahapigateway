const admin = require('f!");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://sadiworkspace.firebaseiod.com'
});

const db = admin.database();
module.exports = db;