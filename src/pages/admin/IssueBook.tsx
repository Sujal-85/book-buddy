import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Calendar, CheckCircle, BookOpen } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibInput from '@/components/ui/LibInput';
import LibBadge from '@/components/ui/LibBadge';
import PageHeader from '@/components/layout/PageHeader';
import toast from 'react-hot-toast';
import { fetchBookByISBN, searchBooks, GoogleBookItem } from '@/lib/googleBooks';
import { membersApi, booksApi, borrowApi } from '@/services/api';

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
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
          <h3 className="text-sm font-semibold text-foreground mb-3">Step 2: Select Book</h3>
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
          <h3 className="text-sm font-semibold text-foreground mb-3">Step 3: Set Due Date</h3>
          <LibInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </LibCard>

        {/* Step 4: Confirm */}
        <LibButton
          className="w-full"
          disabled={!selectedStudent || !selectedBook || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <><Calendar className="h-4 w-4 mr-2" /> Confirm & Issue Book</>
          )}
        </LibButton>
      </div>
    </div>
  );
};

export default IssueBook;
