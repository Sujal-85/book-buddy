import { db } from './src/services/firebaseAdmin.js';

async function deleteBooks(count: number = 4000) {
  console.log(`Starting deletion of ${count} books...`);
  
  const booksRef = db.collection('books');
  let deletedCount = 0;
  const batchSize = 500; // Firestore batch limit
  
  while (deletedCount < count) {
    const remaining = count - deletedCount;
    const currentBatchSize = Math.min(remaining, batchSize);
    
    // Get batch of books
    const snapshot = await booksRef.limit(currentBatchSize).get();
    
    if (snapshot.empty) {
      console.log('No more books to delete.');
      break;
    }
    
    // Create batch delete
    const batch = db.batch();
    let batchCount = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      batchCount++;
    });
    
    // Commit the batch
    await batch.commit();
    deletedCount += batchCount;
    
    console.log(`Deleted ${batchCount} books. Total deleted: ${deletedCount}`);
    
    // Small delay to avoid rate limits
    if (deletedCount < count) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`\n✅ Successfully deleted ${deletedCount} books from the collection.`);
  process.exit(0);
}

// Delete 4000 books
deleteBooks(4000).catch((error) => {
  console.error('Error deleting books:', error);
  process.exit(1);
});
