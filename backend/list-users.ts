import { db } from './src/services/firebaseAdmin.js';

async function listUsers() {
  const snapshot = await db.collection('users').limit(5).get();
  snapshot.forEach(doc => {
    console.log(`User: ${doc.id} - ${doc.data().email} - ${doc.data().role}`);
  });
  process.exit(0);
}

listUsers();
