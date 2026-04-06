import { db } from './src/services/firebaseAdmin.js';

async function findOverdueStudent() {
  const users = await db.collection('users').get();
  const now = new Date().toISOString();
  
  for (const doc of users.docs) {
    const data = doc.data();
    const borrowed = data.borrowedBooks || [];
    const overdue = borrowed.find((b: any) => b.status === 'borrowed' && b.dueDate < now);
    if (overdue) {
      console.log('Found Overdue Student:');
      console.log('ID:', doc.id);
      console.log('Email:', data.email);
      console.log('Book:', overdue.title);
      console.log('Due Date:', overdue.dueDate);
      process.exit(0);
    }
  }
  console.log('No overdue student found.');
  process.exit(0);
}

findOverdueStudent();
