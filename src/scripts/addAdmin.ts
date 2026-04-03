
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedAdmin = async () => {
  console.log('🚀 Starting Admin Seeding...');
  
  const adminId = 'admin_user_1'; // Fixed ID for local dev
  const adminData = {
    displayName: 'System Admin',
    email: 'admin@bookbuddy.com',
    role: 'admin',
    isProfileComplete: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    studentId: 'ADMIN-001',
    phone: '+91 9999999999'
  };

  try {
    await setDoc(doc(db, 'users', adminId), adminData);
    console.log('✅ Admin user created successfully!');

    // Add some test students too
    const students = [
      { id: 'student_1', name: 'Alice Johnson', email: 'alice@test.com', studentId: 'STU-001' },
      { id: 'student_2', name: 'Bob Smith', email: 'bob@test.com', studentId: 'STU-002' },
    ];

    for (const s of students) {
      await setDoc(doc(db, 'users', s.id), {
        displayName: s.name,
        email: s.email,
        studentId: s.studentId,
        role: 'student',
        isProfileComplete: true,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Seeded student: ${s.name}`);
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedAdmin();
