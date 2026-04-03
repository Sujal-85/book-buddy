import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Use environment variables for service account if available
// Otherwise, try to find a local JSON file (not recommended for production)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  try {
    if (serviceAccount.projectId && serviceAccount.clientEmail && serviceAccount.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
      console.log('✅ Firebase Admin Initialized with Environment Variables');
    } else {
      // Fallback for local testing if variables are missing
      admin.initializeApp();
      console.log('⚠️ Firebase Admin Initialized with Default Credentials');
    }
  } catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error);
  }
}

export const db: admin.firestore.Firestore = admin.firestore();
export const auth: admin.auth.Auth = admin.auth();
export default admin;
