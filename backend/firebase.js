require('dotenv').config();
const admin = require('firebase-admin');

// Set FIREBASE_SERVICE_ACCOUNT_PATH in .env pointing to your Firebase service account JSON
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    admin.initializeApp();
  }
}

module.exports = admin;
