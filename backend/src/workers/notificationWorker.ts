import { db } from '../services/firebaseAdmin.js';
import { sendDueDateReminder } from '../services/emailService.js';
import { addDays, isBefore, format } from 'date-fns';

/**
 * Scans for books that are due in exactly 48 or 24 hours
 * and sends an automated email reminder to students.
 */
export const runNotificationWorker = async () => {
  console.log('--- [Notification Worker] Starting scan for due dates... ---');
  
  try {
    const now = new Date();
    const twoDaysFromNow = addDays(now, 2);
    
    // Fetch all active borrows
    const borrowsSnap = await db.collection('borrows')
      .where('status', '==', 'issued')
      .get();
      
    if (borrowsSnap.empty) {
      console.log('No active borrows found.');
      return;
    }

    for (const doc of borrowsSnap.docs) {
      const borrowData = doc.data();
      const dueDate = new Date(borrowData.dueDate);
      
      // Check if due date is within the next 48 hours and we haven't sent a reminder yet
      if (isBefore(dueDate, twoDaysFromNow) && !borrowData.reminderSent) {
        // Fetch student email
        const studentSnap = await db.collection('users').doc(borrowData.studentId).get();
        const studentData = studentSnap.data();
        
        // Fetch book title
        const bookSnap = await db.collection('books').doc(borrowData.bookId).get();
        const bookData = bookSnap.data();

        if (studentData?.email && bookData?.title) {
          console.log(`Sending reminder to ${studentData.email} for "${bookData.title}"`);
          
          await sendDueDateReminder(
            studentData.email, 
            bookData.title, 
            format(dueDate, 'PP')
          );
          
          // Mark as reminder sent to avoid duplicate emails
          await doc.ref.update({ reminderSent: true });
        }
      }
    }
    
    console.log('--- [Notification Worker] Scan complete. ---');
  } catch (error) {
    console.error('Error in Notification Worker:', error);
  }
};

// Start the worker on an interval (e.g., every 12 hours)
setInterval(runNotificationWorker, 12 * 60 * 60 * 1000);
