import { db } from './src/services/firebaseAdmin.js';
import * as admin from 'firebase-admin';

async function seedOverdue() {
  const studentId = 'test_student_123';
  const studentEmail = 'antigravity_test@mailinator.com'; // Use a test email
  
  console.log('Seeding overdue book for student:', studentId);

  // 1. Ensure user exists
  await db.collection('users').doc(studentId).set({
    email: studentEmail,
    name: 'Test Student',
    role: 'student',
    borrowedBooks: [
      {
        title: 'Mastering TypeScript',
        dueDate: '2024-01-01', // Definitely overdue
        status: 'borrowed'
      }
    ]
  }, { merge: true });

  // 2. Add to borrows collection (for Overdue page)
  await db.collection('borrows').add({
    studentId,
    bookId: 'book_ts_101',
    dueDate: '2024-01-01',
    status: 'active',
    issuedAt: new Date() // Fallback to basic Date for testing simplicity
  });

  console.log('Success! Test overdue book seeded.');
  process.exit(0);
}

seedOverdue();
