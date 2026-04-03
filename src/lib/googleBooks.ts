export interface GoogleBookVolumeInfo {
  title: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
  language?: string;
  previewLink?: string;
  infoLink?: string;
  canonicalVolumeLink?: string;
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: GoogleBookVolumeInfo;
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBookItem[];
}

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

/**
 * Fetch a book from Google Books API by its ISBN.
 * @param isbn The 10 or 13 digit ISBN.
 * @returns The first matching book or null if not found.
 */
export const fetchBookByISBN = async (isbn: string): Promise<GoogleBookItem | null> => {
  const cleanIsbn = isbn.replace(/[- ]/g, '');
  try {
    const response = await fetch(`${BASE_URL}?q=isbn:${cleanIsbn}`);
    if (!response.ok) throw new Error('Failed to fetch from Google Books');
    
    const data: GoogleBooksResponse = await response.json();
    if (data.totalItems > 0 && data.items) {
      return data.items[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching book by ISBN:', error);
    return null;
  }
};

/**
 * Search for books in Google Books API.
 * @param query The search query (title, author, etc.).
 * @returns A list of matching books.
 */
export const searchBooks = async (query: string): Promise<GoogleBookItem[]> => {
  if (!query.trim()) return [];
  try {
    const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=10`);
    if (!response.ok) throw new Error('Failed to fetch from Google Books');
    
    const data: GoogleBooksResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
};
