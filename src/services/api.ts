import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc,
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';

const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:3001/api';

// Helper for Firestore data mapping
const mapDoc = (doc: any) => ({ id: doc.id, ...doc.data() });

// Books API (Firestore)
export const booksApi = {
  getAll: async (params?: Record<string, any>) => {
    if (!db) throw new Error('Firestore not initialized');
    let q = query(collection(db, 'books'), orderBy('title'));
    
    if (params?.category && params.category !== 'All') {
      q = query(collection(db, 'books'), where('category', '==', params.category));
    }

    const limitCount = params?.limit ? parseInt(String(params.limit), 10) : undefined;
    
    // Only use Firestore limit if not searching clientside
    if (limitCount && !params?.search) {
      q = query(q, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(mapDoc);

    // Clientside search if query is provided
    if (params?.search) {
      const s = params.search.toLowerCase();
      data = data.filter(b => 
        (b.title?.toLowerCase() || '').includes(s) || 
        (b.author?.toLowerCase() || '').includes(s) ||
        (b.isbn?.toLowerCase() || '').includes(s)
      );
      
      if (limitCount) {
        data = data.slice(0, limitCount);
      }
    }

    return { data };
  },

  getUniqueCategories: async () => {
    if (!db) throw new Error('Firestore not initialized');
    const snapshot = await getDocs(collection(db, 'books'));
    const categories = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        // Handle semicolon-separated categories if any
        data.category.split(';').forEach((cat: string) => {
          const trimmed = cat.trim();
          if (trimmed) categories.add(trimmed);
        });
      }
    });

    return Array.from(categories).sort();
  },

  getById: async (id: string) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'books', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Book not found');
    return { data: mapDoc(snap) };
  },

  create: async (data: Record<string, unknown>) => {
    if (!db) throw new Error('Firestore not initialized');
    const res = await addDoc(collection(db, 'books'), {
      ...data,
      available: true,
      createdAt: serverTimestamp(),
    });
    return { data: { id: res.id, ...data } };
  },

  update: async (id: string, data: Record<string, unknown>) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'books', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    return { data: { id, ...data } };
  },

  delete: async (id: string) => {
    if (!db) throw new Error('Firestore not initialized');
    await deleteDoc(doc(db, 'books', id));
    return { data: true };
  },
};

// Borrow API (Firestore)
export const borrowApi = {
  issue: async (data: { studentId: string; bookId: string; dueDate: string }) => {
    if (!db) throw new Error('Firestore not initialized');
    
    // 1. Create borrow record
    const borrowRef = await addDoc(collection(db, 'borrows'), {
      ...data,
      status: 'active',
      issuedAt: serverTimestamp(),
      returnedAt: null,
    });

    // 2. Update book availability
    await updateDoc(doc(db, 'books', data.bookId), { available: false });

    return { data: { id: borrowRef.id, ...data } };
  },

  getStudentBorrows: async (studentId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, 'borrows'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    const borrows = snap.docs.map(mapDoc);

    // Fetch related book titles in parallel
    const borrowsWithBooks = await Promise.all(borrows.map(async (b) => {
      const bookSnap = await getDoc(doc(db, 'books', b.bookId));
      return { ...b, book: bookSnap.exists() ? bookSnap.data() : { title: 'Unknown Book' } };
    }));

    return { data: borrowsWithBooks };
  },

  getActive: async () => {
    if (!db) throw new Error('Firestore not initialized');
    // REMOVED `orderBy` as it requires a composite index that might be missing
    const q = query(collection(db, 'borrows'), where('status', '==', 'active'));
    const snap = await getDocs(q);
    // Client-side sort by issuedAt (desc)
    const records = snap.docs.map(mapDoc).sort((a, b) => {
      const timeA = a.issuedAt?.seconds || 0;
      const timeB = b.issuedAt?.seconds || 0;
      return timeB - timeA;
    });

    // Populate student and book names for return management
    const detailedRecords = await Promise.all(records.map(async (record) => {
      try {
        // Get Student Profile
        const studentSnap = await getDoc(doc(db, 'users', record.studentId));
        const studentData = studentSnap.exists() ? studentSnap.data() : { name: 'Unknown Student' };

        // Get Book Info
        const bookSnap = await getDoc(doc(db, 'books', record.bookId));
        const bookData = bookSnap.exists() ? bookSnap.data() : { title: 'Unknown Book' };

        return {
          ...record,
          studentName: studentData.name || studentData.displayName || 'Unknown Student',
          bookTitle: bookData.title || 'Unknown Book'
        };
      } catch (err) {
        console.error('Error fetching borrow details:', err);
        return {
          ...record,
          studentName: 'Error Loading',
          bookTitle: 'Error Loading'
        };
      }
    }));

    return { data: detailedRecords };
  },

  returnBook: async (borrowId: string, bookId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    
    // 1. Update borrow record
    await updateDoc(doc(db, 'borrows', borrowId), {
      status: 'returned',
      returnedAt: serverTimestamp()
    });

    // 2. Make book available again
    await updateDoc(doc(db, 'books', bookId), {
      available: true
    });

    return { data: true };
  },

  payFine: async (borrowId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    await updateDoc(doc(db, 'borrows', borrowId), {
      finePaid: true,
      finePaidAt: serverTimestamp()
    });
    return { data: true };
  },

  getOverdue: async () => {
    if (!db) throw new Error('Firestore not initialized');
    const today = new Date().toISOString();
    // Fetch all active borrows and filter for overdue locally to avoid composite index requirement
    const q = query(collection(db, 'borrows'), where('status', '==', 'active'));
    const snap = await getDocs(q);
    
    const records = snap.docs
      .map(mapDoc)
      .filter(record => record.dueDate < today)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Hydrate
    const detailedRecords = await Promise.all(records.map(async (record) => {
      const studentSnap = await getDoc(doc(db, 'users', record.studentId));
      const bookSnap = await getDoc(doc(db, 'books', record.bookId));
      
      return {
        ...record,
        studentName: studentSnap.exists() ? (studentSnap.data().name || studentSnap.data().displayName) : 'Unknown',
        bookTitle: bookSnap.exists() ? bookSnap.data().title : 'Unknown Book'
      };
    }));

    return { data: detailedRecords };
  }
};

// Placeholder APIs (to be implemented as needed)
export const membersApi = {
  getAll: async () => {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return { data: snapshot.docs.map(mapDoc) };
  },
  
  getById: async (id: string) => {
    if (!db) throw new Error('Firestore not initialized');
    const snap = await getDoc(doc(db, 'users', id));
    return { data: snap.exists() ? mapDoc(snap) : null };
  },

  create: async (data: Record<string, any>) => {
    if (!db) throw new Error('Firestore not initialized');
    const res = await addDoc(collection(db, 'users'), {
      ...data,
      role: 'student',
      isProfileComplete: true,
      createdAt: serverTimestamp(),
    });
    return { data: { id: res.id, ...data } };
  },

  update: async (id: string, data: Record<string, any>) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'users', id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    return { data: { id, ...data } };
  },

  delete: async (id: string) => {
    if (!db) throw new Error('Firestore not initialized');
    await deleteDoc(doc(db, 'users', id));
    return { data: true };
  }
};

// Notifications API (Backend-driven)
export const notificationsApi = {
  getAll: async (studentId?: string) => {
    const id = studentId || auth.currentUser?.uid;
    if (!id) return { data: [] };
    const response = await fetch(`${AI_BACKEND_URL}/notifications?studentId=${id}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return await response.json();
  },

  markRead: async (id: string) => {
    const response = await fetch(`${AI_BACKEND_URL}/notifications/${id}/read`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return await response.json();
  },

  markAllRead: async (studentId?: string) => {
    const id = studentId || auth.currentUser?.uid;
    if (!id) return { success: false };
    const response = await fetch(`${AI_BACKEND_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: id })
    });
    if (!response.ok) throw new Error('Failed to mark all as read');
    return await response.json();
  },

  scanOverdue: async () => {
    const response = await fetch(`${AI_BACKEND_URL}/notifications/scan-overdue`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to trigger overdue scan');
    return await response.json();
  },

  // Legacy stubs for compatibility with useNotifications hook if needed
  sendReminder: async (borrowId: string) => {
     // This can be kept as a placeholder or connected to scanOverdue
     return { success: true };
  },
  
  sendBulkReminders: async () => {
     return notificationsApi.scanOverdue();
  },

  sendSingleReminder: async (data: { studentId: string; bookTitle: string; dueDate: string }) => {
    const response = await fetch(`${AI_BACKEND_URL}/notifications/send-single-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to send individual reminder');
    return await response.json();
  }
};

export const settingsApi = {
  get: async () => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'settings', 'library_settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { data: snap.data() };
    }
    // Default settings if none exist
    return { 
      data: {
        libraryName: 'Central University Library',
        timings: '9:00 AM - 8:00 PM (Mon-Sat)',
        contact: 'library@university.edu | +91 1234567890',
        rules: 'Books must be returned within the due date. Fines will be charged for late returns.',
        finePerDay: 5,
        maxBorrowDays: 14,
        maxBooksPerStudent: 3,
      } 
    };
  },
  
  update: async (data: Record<string, any>) => {
    if (!db) throw new Error('Firestore not initialized');
    const docRef = doc(db, 'settings', 'library_settings');
    await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { data: true };
  }
};

export const dashboardApi = {
  getStats: async () => {
    if (!db) throw new Error('Firestore not initialized');
    
    // 1. Total Books
    const booksSnap = await getDocs(collection(db, 'books'));
    const totalBooks = booksSnap.size;

    // 2. Books Issued (Active borrows)
    const issuedSnap = await getDocs(query(collection(db, 'borrows'), where('status', '==', 'active')));
    const booksIssued = issuedSnap.size;

    // 3. Total Members (Students)
    const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
    const totalMembers = usersSnap.size;

    // 4. Overdue Books (Calculated from active borrows)
    const today = new Date().toISOString();
    const overdueBooks = issuedSnap.docs.filter(doc => (doc.data().dueDate < today)).length;

    return {
      data: {
        totalBooks,
        booksIssued,
        totalMembers,
        overdueBooks
      }
    };
  },

  getRecentIssues: async () => {
    if (!db) throw new Error('Firestore not initialized');
    // REMOVED `orderBy` to avoid index requirement
    const q = query(collection(db, 'borrows'), limit(10));
    const snap = await getDocs(q);
    // Client-side sort and hydrate
    const records = snap.docs.map(mapDoc).sort((a, b) => {
      const timeA = a.issuedAt?.seconds || 0;
      const timeB = b.issuedAt?.seconds || 0;
      return timeB - timeA;
    });

    const detailedRecords = await Promise.all(records.map(async (record: any) => {
      const studentSnap = await getDoc(doc(db, 'users', record.studentId));
      const bookSnap = await getDoc(doc(db, 'books', record.bookId));
      
      const studentData = studentSnap.exists() ? studentSnap.data() : {};
      const bookData = bookSnap.exists() ? bookSnap.data() : {};

      return {
        ...record,
        student: studentData.name || studentData.displayName || 'Unknown Student',
        bookName: bookData.title || 'Unknown Book'
      };
    }));

    return { data: detailedRecords };
  }
};

// Wishlist API (Firestore)
export const wishlistApi = {
  get: async (userId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, 'wishlist'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const wishlist = snap.docs.map(mapDoc);

    // Populate book info
    const detailed = await Promise.all(wishlist.map(async (item) => {
      const bookSnap = await getDoc(doc(db, 'books', item.bookId));
      return { ...item, book: bookSnap.exists() ? bookSnap.data() : { title: 'Unknown' } };
    }));

    return { data: detailed };
  },

  toggle: async (userId: string, bookId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    // Fetch all for user and filter locally to avoid composite index requirement
    const q = query(collection(db, 'wishlist'), where('userId', '==', userId));
    const snap = await getDocs(q);
    
    const existing = snap.docs.find(d => d.data().bookId === bookId);

    if (!existing) {
      const res = await addDoc(collection(db, 'wishlist'), {
        userId,
        bookId,
        addedAt: serverTimestamp(),
      });
      return { data: { id: res.id, added: true } };
    } else {
      await deleteDoc(doc(db, 'wishlist', existing.id));
      return { data: { added: false } };
    }
  },

  remove: async (id: string) => {
    if (!db) throw new Error('Firestore not initialized');
    await deleteDoc(doc(db, 'wishlist', id));
    return { data: true };
  }
};

// Reviews API
export const reviewsApi = {
  getByBook: async (bookId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    // Fetch and sort locally to avoid composite index requirement
    const q = query(collection(db, 'reviews'), where('bookId', '==', bookId));
    const snap = await getDocs(q);
    
    const reviews = await Promise.all(snap.docs.map(mapDoc).map(async (r: any) => {
      const userSnap = await getDoc(doc(db, 'users', r.userId));
      const userData = userSnap.exists() ? userSnap.data() : { name: 'Anonymous Reader' };
      return { 
        ...r, 
        userName: userData.name || userData.displayName || 'Anonymous Reader'
      };
    }));

    // Sort by createdAt desc locally
    return { data: reviews.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    })};
  },

  getAll: async () => {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, 'reviews'));
    const snap = await getDocs(q);
    
    const reviews = await Promise.all(snap.docs.map(mapDoc).map(async (r: any) => {
      const userSnap = await getDoc(doc(db, 'users', r.userId));
      const bookSnap = await getDoc(doc(db, 'books', r.bookId));
      
      const userData = userSnap.exists() ? userSnap.data() : { name: 'Anonymous Reader' };
      const bookData = bookSnap.exists() ? bookSnap.data() : { title: 'Unknown Book', author: 'Unknown' };
      
      return { 
        ...r, 
        userName: userData.name || userData.displayName || 'Anonymous Reader',
        bookTitle: bookData.title,
        bookAuthor: bookData.author
      };
    }));

    return { data: reviews.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    })};
  },

  add: async (data: { bookId: string; userId: string; rating: number; comment: string }) => {
    if (!db) throw new Error('Firestore not initialized');
    const res = await addDoc(collection(db, 'reviews'), {
      ...data,
      createdAt: serverTimestamp(),
    });

    // Update book aggregate rating (optional logic)
    return { data: { id: res.id, ...data } };
  }
};

// Reading Goals & Stats API
export const goalsApi = {
  getGoals: async (userId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, 'reading_goals'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return { data: snap.docs.map(mapDoc) };
  },

  updateProgress: async (goalId: string, progress: number) => {
    if (!db) throw new Error('Firestore not initialized');
    await updateDoc(doc(db, 'reading_goals', goalId), { progress, updatedAt: serverTimestamp() });
    return { data: true };
  },

  getAchievements: async (userId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, 'achievements'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return { data: snap.docs.map(mapDoc) };
  },

  create: async (userId: string, data: any) => {
    if (!db) throw new Error('Firestore not initialized');
    const res = await addDoc(collection(db, 'reading_goals'), {
      ...data,
      userId,
      createdAt: serverTimestamp(),
    });
    return { data: { id: res.id, ...data } };
  }
};

// Alerts API (Firestore)
export const alertsApi = {
  get: async (userId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    const q = query(collection(db, 'alerts'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const alerts = snap.docs.map(mapDoc);

    // Populate book info
    const detailed = await Promise.all(alerts.map(async (alert) => {
      const bookSnap = await getDoc(doc(db, 'books', alert.bookId));
      return { ...alert, book: bookSnap.exists() ? bookSnap.data() : { title: 'Unknown' } };
    }));

    return { data: detailed };
  },

  create: async (userId: string, bookId: string) => {
    if (!db) throw new Error('Firestore not initialized');
    
    // Check if alert already exists
    const q = query(collection(db, 'alerts'), where('userId', '==', userId), where('bookId', '==', bookId));
    const snap = await getDocs(q);
    if (!snap.empty) return { data: mapDoc(snap.docs[0]) };

    const res = await addDoc(collection(db, 'alerts'), {
      userId,
      bookId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { data: { id: res.id, userId, bookId, status: 'pending' } };
  },

  remove: async (id: string) => {
    if (!db) throw new Error('Firestore not initialized');
    await deleteDoc(doc(db, 'alerts', id));
    return { data: true };
  }
};

// Renewal API
export const renewalApi = {
  request: async (borrowId: string, reason: string) => {
    if (!db) throw new Error('Firestore not initialized');
    await updateDoc(doc(db, 'borrows', borrowId), {
      renewalRequested: true,
      renewalReason: reason,
      renewalStatus: 'pending',
      renewalRequestedAt: serverTimestamp()
    });
    return { data: true };
  }
};

export default booksApi;
