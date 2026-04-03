
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp, getDocs, query, where, writeBatch } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Basic CSV Row Parser
 * Handles quoted strings with commas inside them.
 */
function parseCsvRow(row: string) {
  const result = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField.trim());
  return result;
}

const importBooks = async () => {
  console.log('🚀 Starting Book Import from data.csv...');
  
  const csvPath = path.resolve(__dirname, '../../public/data.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV File not found at: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = parseCsvRow(lines[0]); // isbn13,isbn10,title,subtitle,authors,categories,thumbnail,description,published_year,average_rating,num_pages,ratings_count

  const booksToAdd = [];

  // Skip header, process rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCsvRow(line);
    if (values.length < 5) continue; // Basic validation

    const book = {
      isbn13: values[0],
      isbn10: values[1],
      title: values[2],
      subtitle: values[3],
      author: values[4],      // Map authors to author
      category: values[5],    // Map categories to category
      cover: values[6] ? values[6].replace('http://', 'https://') : '', // Use HTTPS for visibility
      description: values[7],
      publishedYear: values[8],
      rating: values[9],
      pages: values[10],
      available: true,
      createdAt: serverTimestamp(),
    };

    if (book.isbn13 && book.title) {
        booksToAdd.push(book);
    }
  }

  console.log(`📦 Found ${booksToAdd.length} valid book records. Beginning Firestore import...`);

  let addedCount = 0;
  const BATCH_SIZE = 400; // Firestore limit is 500

  for (let i = 0; i < booksToAdd.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = booksToAdd.slice(i, i + BATCH_SIZE);

    for (const book of chunk) {
      const bookRef = doc(db, 'books', book.isbn13);
      batch.set(bookRef, book, { merge: true }); // Uses set + merge to handle "check and add" (upsert)
    }

    try {
      await batch.commit();
      addedCount += chunk.length;
      console.log(`✅ Progress: Imported ${addedCount}/${booksToAdd.length} books...`);
    } catch (error) {
      console.error(`❌ Batch failed at index ${i}:`, error);
    }
  }

  console.log(`\n🎉 Import Complete!`);
  console.log(`📚 Total Books Processed: ${booksToAdd.length}`);
  console.log(`✨ You can now see the new books in the Browse Books section.`);
  process.exit(0);
};

importBooks().catch(err => {
  console.error('❌ Fatal Error:', err);
  process.exit(1);
});
