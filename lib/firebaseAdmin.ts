import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!)
      ),
    });
  } catch (error) {
    console.error('Error inicializando Firebase Admin:', error);
  }
}

const dbAdmin = admin.firestore();
export { dbAdmin, admin };