const db = require('../firebase');

async function getFirebasePaths() {
  try {
    const snapshot = await db.ref("/").once("value");
    const data = snapshot.val();

    // Only include meaningful root keys
    const knownPaths = [
      "0001currentsession",
      "0002SessionNotes",
      "contexts",
      "chatLogs",
      "sessionControl"
    ];

    return Object.keys(data || {}).reduce(
      (accu, key) => {
        if (knownPaths.includes(key)) accu.push(key);
        return accu;
      },
      []
    );
  } catch (error) {
    console.error("“Firebase path fetch error:", error.message);
    return [];
  }
}

module.exports = { getFirebasePaths };
