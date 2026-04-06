import { db } from './src/services/firebaseAdmin.js';

async function verifyNotification() {
  const studentId = 'test_student_123';
  const snapshot = await db.collection('notifications')
    .where('studentId', '==', studentId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.log('No notification found for student.');
  } else {
    const data = snapshot.docs[0].data();
    console.log('Latest Notification:');
    console.log('Title:', data.title);
    console.log('Message:', data.message);
    console.log('Read:', data.read);
  }
  process.exit(0);
}

verifyNotification();
