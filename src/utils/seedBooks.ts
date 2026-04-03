import { db } from '@/services/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore';
import { fetchBookByISBN, searchBooks } from '@/lib/googleBooks';

const TARGET_BOOKS = [
  '9780132350884', // Clean Code
  '9780201633610', // Design Patterns
  '9780135957059', // The Pragmatic Programmer
  '9780134757599', // Refactoring
  '9780262033848', // Introduction to Algorithms
  '9780136042594', // Artificial Intelligence: A Modern Approach
  '9780133970777', // Fundamentals of Database Systems
  '9780132126953', // Computer Networks
  '9781119293323', // CompTIA Network+
  '9780134685991', // Effective Java
];

export const seedBooks = async () => {
  if (!db) {
    console.error('Firestore not initialized');
    return;
  }

  // Check if books already exist
  const q = query(collection(db, 'books'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    console.log('Books already seeded skipping...');
    return;
  }

  console.log('Seeding books...');
  let count = 0;

  for (const isbn of TARGET_BOOKS) {
    try {
      const bookData = await fetchBookByISBN(isbn);
      if (bookData) {
        const { volumeInfo } = bookData;
        await addDoc(collection(db, 'books'), {
          title: volumeInfo.title,
          author: volumeInfo.authors?.join(', ') || 'Unknown Author',
          isbn: isbn,
          category: volumeInfo.categories?.[0] || 'Computer Science',
          description: volumeInfo.description || '',
          totalCopies: 5,
          available: true,
          publisher: volumeInfo.publisher || '',
          year: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : 2024,
          cover: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
          createdAt: serverTimestamp(),
        });
        count++;
      }
    } catch (err) {
      console.error(`Failed to seed book with ISBN ${isbn}:`, err);
    }
  }

  console.log(`Successfully seeded ${count} books.`);
  return count;
};
