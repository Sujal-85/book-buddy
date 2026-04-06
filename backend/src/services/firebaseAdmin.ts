import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Use environment variables for service account if available
// Otherwise, try to find a local JSON file (not recommended for production)
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'famt-library';

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
        projectId: PROJECT_ID
      });
      console.log(`✅ Firebase Admin Initialized for [${PROJECT_ID}] with Service Account`);
    } else {
      // Force explicit project ID for default credentials too
      admin.initializeApp({
        projectId: PROJECT_ID
      });
      console.log(`⚠️ Firebase Admin Initialized for [${PROJECT_ID}] with Default Credentials`);
      
      if (admin.app().options.projectId === 'auratalk-chatapp') {
        process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
        console.warn('❌ CRITICAL: Wrong project detected (auratalk-chatapp). Forcing override to famt-library...');
      }
    }
  } catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error);
  }
}

export const db: admin.firestore.Firestore = admin.firestore();
export const auth: admin.auth.Auth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export default admin;
