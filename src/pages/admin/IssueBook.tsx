import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Calendar, CheckCircle, BookOpen, QrCode, Camera, X } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibInput from '@/components/ui/LibInput';
import LibBadge from '@/components/ui/LibBadge';
import PageHeader from '@/components/layout/PageHeader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { fetchBookByISBN, searchBooks, GoogleBookItem } from '@/lib/googleBooks';
import { membersApi, booksApi, borrowApi, settingsApi } from '@/services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Demo data removed for real implementation

const IssueBook: React.FC = () => {
  const location = useLocation();
  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  
  const [bookSearch, setBookSearch] = useState('');
  const [libraryBooks, setLibraryBooks] = useState<any[]>([]);
  const [isSearchingLibrary, setIsSearchingLibrary] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalBooks, setExternalBooks] = useState<GoogleBookItem[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [borrowSettings, setBorrowSettings] = useState({
    maxBorrowDays: 14,
    maxBooksPerStudent: 3,
    finePerDay: 5
  });
  const [studentBorrowCount, setStudentBorrowCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // QR Scanner states
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Load borrow settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: settings } = await settingsApi.get();
        setBorrowSettings({
          maxBorrowDays: settings.maxBorrowDays || 14,
          maxBooksPerStudent: settings.maxBooksPerStudent || 3,
          finePerDay: settings.finePerDay || 5
        });
        // Set default due date based on settings
        const d = new Date();
        d.setDate(d.getDate() + (settings.maxBorrowDays || 14));
        setDueDate(d.toISOString().split('T')[0]);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Fetch student's current borrow count when student is selected
  useEffect(() => {
    if (selectedStudent?.id) {
      const fetchStudentBorrows = async () => {
        try {
          const { data: borrows } = await borrowApi.getStudentBorrows(selectedStudent.id);
          const activeBorrows = borrows.filter((b: any) => b.status === 'active');
          setStudentBorrowCount(activeBorrows.length);
        } catch (err) {
          console.error('Failed to fetch student borrows:', err);
        }
      };
      fetchStudentBorrows();
    } else {
      setStudentBorrowCount(0);
    }
  }, [selectedStudent]);

  // Load book from navigation state if present
  useEffect(() => {
    const bookId = location.state?.bookId;
    if (bookId) {
      const fetchBook = async () => {
        try {
          const { data } = await booksApi.getById(bookId);
          setSelectedBook(data);
        } catch (err) {
          console.error('Error fetching book from state:', err);
        }
      };
      fetchBook();
    }
  }, [location.state]);

  // Real-time student search
  React.useEffect(() => {
    if (studentSearch.length < 2) {
      setStudents([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingStudents(true);
      try {
        const { data } = await membersApi.getAll();
        const filtered = data
          .filter((u: any) => u.role === 'student')
          .filter((u: any) => 
            (u.displayName || '').toLowerCase().includes(studentSearch.toLowerCase()) || 
            (u.email || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
            u.id.toLowerCase().includes(studentSearch.toLowerCase())
          );
        setStudents(filtered.map(u => ({
          id: u.id,
          name: u.displayName || u.email.split('@')[0],
          studentId: u.studentId || 'STU-NEW'
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingStudents(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [studentSearch]);

  // Real-time library book search
  React.useEffect(() => {
    if (bookSearch.length < 2) {
      setLibraryBooks([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingLibrary(true);
      try {
        const { data } = await booksApi.getAll({ search: bookSearch });
        setLibraryBooks(data.filter((b: any) => b.available));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingLibrary(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [bookSearch]);

  // Removed as we use actual state for search results

  // QR Scanner functions
  useEffect(() => {
    if (showQRScanner && !scannerRef.current) {
      // Small delay to ensure DOM element is rendered
      const initTimer = setTimeout(() => {
        const element = document.getElementById("admin-qr-reader");
        if (!element) {
          console.error("QR Scanner element not found");
          return;
        }

        scannerRef.current = new Html5QrcodeScanner(
          "admin-qr-reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        scannerRef.current.render(onScanSuccess, onScanFailure);
        setIsScanning(true);
      }, 300);

      return () => clearTimeout(initTimer);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        scannerRef.current = null;
        setIsScanning(false);
      }
    };
  }, [showQRScanner]);

  async function onScanSuccess(decodedText: string) {
    // Stop scanning
    setShowQRScanner(false);
    setIsScanning(false);
    
    // Process QR code data
    // Format: BOOK_ID:<id> or ISBN:<isbn> or just ID/ISBN
    let bookId = decodedText;
    if (decodedText.startsWith('BOOK_ID:')) {
      bookId = decodedText.replace('BOOK_ID:', '');
    } else if (decodedText.startsWith('ISBN:')) {
      bookId = decodedText.replace('ISBN:', '');
    }

    toast.success(`QR Code scanned: ${bookId}`);

    try {
      // Try to find book by ID first
      const { data: book } = await booksApi.getById(bookId);
      if (book) {
        if (book.available) {
          setSelectedBook(book);
          toast.success(`Book found: ${book.title}`);
        } else {
          toast.error(`"${book.title}" is not available for issuing`);
        }
        return;
      }
    } catch (err) {
      // Book not found by ID, try searching by ISBN
      console.log('Book not found by ID, trying ISBN search...');
    }

    // Try searching by ISBN
    try {
      const { data: books } = await booksApi.getAll({ search: bookId });
      const availableBook = books.find((b: any) => b.available);
      
      if (availableBook) {
        setSelectedBook(availableBook);
        toast.success(`Book found: ${availableBook.title}`);
      } else if (books.length > 0) {
        toast.error(`"${books[0].title}" is not available for issuing`);
      } else {
        toast.error('Book not found in library. Please add it first.');
      }
    } catch (err) {
      toast.error('Failed to look up book from QR code');
    }
  }

  function onScanFailure(error: any) {
    // Silently fail - continuous scanning
  }

  const handleExternalSearch = async () => {
    if (!bookSearch.trim()) return;
    setIsSearchingExternal(true);
    const results = await searchBooks(bookSearch);
    setExternalBooks(results);
    setIsSearchingExternal(false);
    if (results.length === 0) {
      toast.error('No books found on Google Books');
    }
  };

  const handleSelectExternalBook = (book: GoogleBookItem) => {
    const isbn = book.volumeInfo.industryIdentifiers?.find(id => id.type.startsWith('ISBN'))?.identifier || 'N/A';
    setSelectedBook({
      id: book.id,
      title: book.volumeInfo.title,
      isbn: isbn,
      author: book.volumeInfo.authors?.join(', '),
      thumbnail: book.volumeInfo.imageLinks?.thumbnail,
      available: true
    });
    setBookSearch('');
    setExternalBooks([]);
    toast.success(`Fetched "${book.volumeInfo.title}" from Google Books`);
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedBook) return;
    
    // Check max books limit
    if (studentBorrowCount >= borrowSettings.maxBooksPerStudent) {
      toast.error(`Student has reached the maximum limit of ${borrowSettings.maxBooksPerStudent} books`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await borrowApi.issue({
        studentId: selectedStudent.id,
        bookId: selectedBook.id,
        dueDate: dueDate
      });
      toast.success(`"${selectedBook.title}" issued to ${selectedStudent.name}`);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue book');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <PageHeader title="Issue Book" />
        <LibCard className="max-w-md mx-auto text-center py-12">
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Book Issued Successfully</h3>
          <p className="text-sm text-muted-foreground mb-6">
            "{selectedBook?.title}" has been issued to {selectedStudent?.name}
          </p>
          <LibButton onClick={() => { setSubmitted(false); setSelectedStudent(null); setSelectedBook(null); }}>
            Issue Another Book
          </LibButton>
        </LibCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Issue Book" description="Issue a book to a student" />

      <div className="max-w-lg mx-auto space-y-6">
        {/* Step 1: Select Student */}
        <LibCard>
          <h3 className="text-sm font-semibold text-foreground mb-3">Step 1: Select Student</h3>
          {selectedStudent ? (
            <div className="flex items-center justify-between p-3 bg-secondary rounded-md">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedStudent.name}</p>
                <p className="text-xs text-muted-foreground">{selectedStudent.id}</p>
                <p className={`text-xs mt-1 ${studentBorrowCount >= borrowSettings.maxBooksPerStudent ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                  Books borrowed: {studentBorrowCount} / {borrowSettings.maxBooksPerStudent}
                  {studentBorrowCount >= borrowSettings.maxBooksPerStudent && ' (Limit reached)'}
                </p>
              </div>
              <LibButton variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>Change</LibButton>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Type student name or ID..." className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              {isSearchingStudents && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent" />
                </div>
              )}
              {students.length > 0 && (
                <div className="absolute w-full mt-1 bg-card border border-border rounded-md z-10 shadow-lg max-h-48 overflow-y-auto">
                  {students.map((s) => (
                    <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(''); }} className="w-full text-left px-3 py-2 hover:bg-secondary text-sm block">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">{s.studentId}</div>
                    </button>
                  ))}
                </div>
              )}
              {studentSearch.length > 1 && students.length === 0 && !isSearchingStudents && (
                <div className="absolute w-full mt-1 p-3 bg-card border border-border rounded-md z-10 text-xs text-muted-foreground text-center italic">
                  No students found matching your search.
                </div>
              )}
            </div>
          )}
        </LibCard>

        {/* Step 2: Select Book */}
        <LibCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Step 2: Select Book</h3>
            {!selectedBook && (
              <LibButton 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowQRScanner(true)}
                className="flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Scan QR
              </LibButton>
            )}
          </div>
          {selectedBook ? (
            <div className="flex items-center justify-between p-3 bg-secondary rounded-md gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {selectedBook.thumbnail ? (
                  <img src={selectedBook.thumbnail} alt={selectedBook.title} className="h-12 w-9 rounded object-cover shadow-sm flex-shrink-0" />
                ) : (
                  <div className="h-12 w-9 bg-muted flex items-center justify-center rounded flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{selectedBook.title}</p>
                  <p className="text-xs text-muted-foreground truncate">ISBN: {selectedBook.isbn}</p>
                  {selectedBook.author && <p className="text-[10px] text-muted-foreground truncate italic">by {selectedBook.author}</p>}
                </div>
              </div>
              <LibButton variant="ghost" size="sm" className="flex-shrink-0" onClick={() => setSelectedBook(null)}>Change</LibButton>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input 
                  value={bookSearch} 
                  onChange={(e) => setBookSearch(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleExternalSearch()}
                  placeholder="Search library title, or ISBN..." 
                  className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
                />
                
                {isSearchingLibrary && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent" />
                  </div>
                )}

                {libraryBooks.length > 0 && (
                  <div className="absolute w-full mt-1 bg-card border border-border rounded-md z-10 shadow-lg overflow-hidden">
                    {libraryBooks.map((b) => (
                      <button key={b.id} onClick={() => { setSelectedBook(b); setBookSearch(''); }} className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex justify-between items-center bg-card">
                        <span className="truncate">{b.title} <span className="text-muted-foreground ml-1 text-xs">(ISBN: {b.isbn})</span></span>
                        <LibBadge variant="available" className="ml-2">In Library</LibBadge>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!libraryBooks.length && bookSearch.length > 2 && !isSearchingLibrary && !isSearchingExternal && externalBooks.length === 0 && (
                <button 
                  onClick={handleExternalSearch}
                  className="w-full text-xs text-accent hover:bg-accent/5 flex items-center justify-center gap-1 p-2 rounded-md border border-dashed border-accent/30 transition-colors"
                >
                  <Search className="h-3 w-3" /> Not in library? Search Google Books for "{bookSearch}"
                </button>
              )}

              {isSearchingExternal && (
                <div className="flex items-center justify-center py-4 bg-secondary/30 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                  <span className="ml-2 text-xs font-medium text-muted-foreground italic">Fetching from Google Cloud...</span>
                </div>
              )}

              {externalBooks.length > 0 && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Google Search Results</p>
                    <button onClick={() => setExternalBooks([])} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto rounded-md border border-border bg-card shadow-inner custom-scrollbar">
                    {externalBooks.map((book) => (
                      <button 
                        key={book.id} 
                        onClick={() => handleSelectExternalBook(book)}
                        className="w-full text-left p-2.5 hover:bg-secondary border-b last:border-0 border-border flex gap-3 items-start transition-colors"
                      >
                        {book.volumeInfo.imageLinks?.smallThumbnail ? (
                          <img src={book.volumeInfo.imageLinks.smallThumbnail} alt="" className="h-10 w-7.5 object-cover rounded shadow-sm flex-shrink-0" />
                        ) : (
                          <div className="h-10 w-7.5 bg-muted flex items-center justify-center rounded flex-shrink-0"><BookOpen className="h-4 w-4 text-muted-foreground" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{book.volumeInfo.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate italic">{book.volumeInfo.authors?.join(', ') || 'Unknown Author'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] px-1.5 py-0.5 bg-accent/10 text-accent rounded font-mono">
                              ISBN: {book.volumeInfo.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier || book.volumeInfo.industryIdentifiers?.[0]?.identifier || 'N/A'}
                            </span>
                            {book.volumeInfo.pageCount && <span className="text-[9px] text-muted-foreground">{book.volumeInfo.pageCount} pages</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </LibCard>

        {/* Step 3: Due Date */}
        <LibCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Step 3: Set Due Date</h3>
            <span className="text-xs text-muted-foreground">
              Max: {borrowSettings.maxBorrowDays} days
            </span>
          </div>
          <LibInput 
            type="date" 
            value={dueDate} 
            onChange={(e) => setDueDate(e.target.value)} 
            min={new Date().toISOString().split('T')[0]}
          />
        </LibCard>

        {/* Step 4: Confirm */}
        <LibButton
          className="w-full"
          disabled={!selectedStudent || !selectedBook || isSubmitting || studentBorrowCount >= borrowSettings.maxBooksPerStudent}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : studentBorrowCount >= borrowSettings.maxBooksPerStudent ? (
            'Max Books Limit Reached'
          ) : (
            <><Calendar className="h-4 w-4 mr-2" /> Confirm & Issue Book</>
          )}
        </LibButton>
      </div>

      {/* QR Scanner Dialog */}
      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan Book QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div id="admin-qr-reader" className="w-full min-h-[300px] bg-black rounded-lg overflow-hidden" />
            <p className="text-xs text-muted-foreground text-center">
              Position the book's QR code within the camera frame to scan
            </p>
            <div className="flex justify-center gap-2">
              <LibButton 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowQRScanner(false)}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </LibButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IssueBook;
