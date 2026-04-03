import express from 'express';
import { db } from '../services/firebaseAdmin.js'; 
import { sendRenewalAlert } from '../services/emailService.js';

const router = express.Router();

// 1. Submit Renewal Request (Called by student via api.ts)
router.post('/renew-request', async (req, res) => {
  const { borrowId, reason, studentId } = req.body;
  try {
    const borrowRef = db.collection('borrows').doc(borrowId);
    await borrowRef.update({
      renewalRequested: true,
      renewalReason: reason,
      renewalStatus: 'pending',
      renewalRequestedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Admin Approves Renewal (Used by Admin Dashboard)
router.post('/renew-approve', async (req, res) => {
  const { borrowId, adminId, newDueDate } = req.body;
  try {
    const borrowRef = db.collection('borrows').doc(borrowId);
    const snap = await borrowRef.get();
    if (!snap.exists) return res.status(404).json({ error: 'Borrow record not found' });
    
    const borrowData = snap.data();
    if (!borrowData) return res.status(404).json({ error: 'Borrow data is empty' });

    const studentSnap = await db.collection('users').doc(borrowData.studentId).get();
    const studentData = studentSnap.data();
    const bookSnap = await db.collection('books').doc(borrowData.bookId).get();
    const bookData = bookSnap.data();

    // Update Firestore
    await borrowRef.update({
      dueDate: newDueDate,
      renewalStatus: 'approved',
      renewalApprovedAt: new Date().toISOString(),
      renewalApprovedBy: adminId
    });

    // Send Email Notification
    if (studentData?.email && bookData?.title) {
      await sendRenewalAlert(studentData.email, bookData.title, 'approved');
    }

    res.json({ success: true, newDueDate });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Admin Rejects Renewal
router.post('/renew-reject', async (req, res) => {
  const { borrowId, adminId, reason } = req.body;
  try {
    const borrowRef = db.collection('borrows').doc(borrowId);
    const snap = await borrowRef.get();
    const borrowData = snap.data();
    if (!borrowData) return res.status(404).json({ error: 'Borrow data is empty' });
    
    await borrowRef.update({
      renewalStatus: 'rejected',
      renewalRejectReason: reason,
      renewalRejectedAt: new Date().toISOString()
    });

    // Send Email
    const studentSnap = await db.collection('users').doc(borrowData.studentId).get();
    const studentData = studentSnap.data();
    const bookSnap = await db.collection('books').doc(borrowData.bookId).get();
    const bookData = bookSnap.data();

    if (studentData?.email && bookData?.title) {
      await sendRenewalAlert(studentData.email, bookData.title, 'rejected');
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
