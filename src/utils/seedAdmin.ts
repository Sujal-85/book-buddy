import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';

const ADMIN_EMAIL = 'admin@famt.ac.in';

/**
 * Ensures the fixed admin user document exists in Firestore.
 * This is used to "promote" an existing user or create the initial record.
 */
export const seedFixedAdmin = async (uid?: string) => {
  if (!db) return { success: false, error: 'Firestore not initialized' };

  try {
    // 1. If UID is provided, we can directly set the role
    if (uid) {
      await setDoc(doc(db, 'users', uid), {
        email: ADMIN_EMAIL,
        name: 'FAMT Library Admin',
        role: 'admin',
        updatedAt: serverTimestamp(),
        lastActive: new Date().toISOString()
      }, { merge: true });
      return { success: true };
    }

    // 2. If no UID, we just define the rule in AuthContext (handled there)
    return { success: true, message: 'Admin email defined. Use this email to register/login.' };
  } catch (error: any) {
    console.error('Error seeding admin:', error);
    return { success: false, error: error.message };
  }
};
