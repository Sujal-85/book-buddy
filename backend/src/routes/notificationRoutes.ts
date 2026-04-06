import express from 'express';
import * as admin from 'firebase-admin';
import { db, FieldValue } from '../services/firebaseAdmin.js';
import { sendDueDateReminder, sendOverdueAlert } from '../services/emailService.js';

const router = express.Router();

// 1. Get current student's notifications
router.get('/', async (req, res) => {
  const { studentId } = req.query;
  if (!studentId) return res.status(400).json({ error: 'studentId is required' });

  try {
    const q = db.collection('notifications')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .limit(50);
    
    const snap = await q.get();
    const notifications = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ data: notifications });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Mark notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('notifications').doc(id).update({ read: true });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Mark all as read
router.put('/mark-all-read', async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: 'studentId is required' });

  try {
    const q = db.collection('notifications')
      .where('studentId', '==', studentId)
      .where('read', '==', false);
    
    const snap = await q.get();
    const batch = db.batch();
    snap.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
    
    res.json({ success: true, count: snap.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Scan for overdue books and generate alerts
router.post('/scan-overdue', async (req, res) => {
  console.log('🚀 Starting AI Alert Sweep...');
  try {
    const studentsSnapshot = await db.collection('users').get();
    const overdueItems: any[] = [];
    const now = new Date();

    studentsSnapshot.forEach((doc) => {
      const studentData = doc.data();
      const borrowedBooks = studentData.borrowedBooks || [];
      const studentEmail = studentData.email;
      const studentName = studentData.name || studentData.displayName || 'Student';

      borrowedBooks.forEach((book: any) => {
        // Only process currently borrowed books that have a dueDate
        if (book.status === 'borrowed' && book.dueDate) {
          const dueDate = new Date(book.dueDate);
          
          if (dueDate < now) {
            const diffMs = now.getTime() - dueDate.getTime();
            const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            overdueItems.push({
              studentId: doc.id,
              studentEmail,
              studentName,
              bookTitle: book.title,
              dueDate: book.dueDate,
              daysOverdue
            });
          }
        }
      });
    });

    console.log(`🔍 Found ${overdueItems.length} overdue records.`);

    const results = [];
    for (const item of overdueItems) {
      try {
        // 1. Create Firestore Notification
        const notificationRef = await db.collection('notifications').add({
          studentId: item.studentId,
          type: 'overdue',
          title: 'Overdue Book Alert',
          message: `Your book "${item.bookTitle}" was due on ${item.dueDate}. It is ${item.daysOverdue} days overdue.`,
          status: 'unread',
          createdAt: FieldValue.serverTimestamp(),
          metadata: {
            bookTitle: item.bookTitle,
            dueDate: item.dueDate,
            daysOverdue: item.daysOverdue
          }
        });

        // 2. Send Email Notification
        let emailSent = false;
        if (item.studentEmail) {
          try {
            await sendOverdueAlert(item.studentEmail, item.bookTitle, item.dueDate, item.daysOverdue);
            emailSent = true;
          } catch (e: any) {
            console.error(`📧 Email failed for ${item.studentEmail}:`, e.message);
          }
        }

        results.push({
          student: item.studentEmail,
          book: item.bookTitle,
          notificationId: notificationRef.id,
          emailSent
        });
      } catch (innerError: any) {
        console.error(`❌ Item Processing Error:`, innerError.message);
      }
    }

    res.json({
      success: true,
      processed: overdueItems.length,
      details: results
    });

  } catch (error: any) {
    console.error('❌ AI Alert Sweep Fatal Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Send single reminder (Notification + Email)
router.post('/send-single-reminder', async (req, res) => {
  const { studentId, bookTitle, dueDate } = req.body;
  if (!studentId || !bookTitle || !dueDate) {
    return res.status(400).json({ error: 'studentId, bookTitle, and dueDate are required' });
  }

  console.log(`🚩 Processing single overdue reminder for student ${studentId}...`);

  try {
    // 1. Fetch student email if not provided
    const studentDoc = await db.collection('users').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const studentData = studentDoc.data() || {};
    const email = studentData.email;

    // 2. Create Firestore Notification
    const now = new Date();
    const dueDT = new Date(dueDate);
    const diffMs = now.getTime() - dueDT.getTime();
    const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    const notificationRef = await db.collection('notifications').add({
      studentId,
      type: 'overdue',
      title: 'Individual Overdue Reminder',
      message: `Your book "${bookTitle}" was due on ${dueDate}. It is ${daysOverdue} days overdue. Please return it as soon as possible.`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {
        bookTitle,
        dueDate,
        daysOverdue
      }
    });

    // 3. Send Email Notification
    let emailSent = false;
    if (email) {
      try {
        await sendOverdueAlert(email, bookTitle, dueDate, daysOverdue);
        emailSent = true;
      } catch (e: any) {
        console.error(`📧 Email failed for ${email}:`, e.message);
      }
    }

    res.json({
      success: true,
      notificationId: notificationRef.id,
      emailSent,
      message: emailSent ? 'Notification created and email sent' : 'Notification created (email skipped/failed)'
    });

  } catch (error: any) {
    console.error('❌ Single Reminder Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
