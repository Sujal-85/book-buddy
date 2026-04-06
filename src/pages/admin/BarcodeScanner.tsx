import React, { useState, useRef } from 'react';
import { Camera, Keyboard, BookOpen, Search, Plus, CheckCircle, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import { fetchBookByISBN } from '@/lib/googleBooks';
import { booksApi, borrowApi } from '@/services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const BarcodeScanner: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundBook, setFoundBook] = useState<any | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleScan = async () => {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) { toast.error('Please enter a barcode/ISBN'); return; }
    
    setLoading(true);
    try {
      // 1. Check local database first
      const { data: localBooks } = await booksApi.getAll({ search: cleanBarcode, limit: 1 });
      
      if (localBooks && localBooks.length > 0) {
        const book = localBooks[0];
        setFoundBook({
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          category: book.category || 'General',
          publisher: book.publisher || 'N/A',
          year: book.year || 'N/A',
          pages: book.pages || 'N/A',
          source: 'library'
        });
        toast.success('Book found in library catalog!');
      } else {
        // 2. Fetch from Google Books if not in local DB
        const googleBook = await fetchBookByISBN(cleanBarcode);
        if (googleBook) {
          const info = googleBook.volumeInfo;
          setFoundBook({
            title: info.title,
            author: info.authors?.join(', ') || 'Unknown',
            isbn: cleanBarcode,
            category: info.categories?.[0] || 'General',
            publisher: info.publisher || 'N/A',
            year: info.publishedDate ? new Date(info.publishedDate).getFullYear() : 'N/A',
            pages: info.pageCount || 'N/A',
            source: 'external'
          });
          toast.success('Book details fetched from Google Books!');
        } else {
          setFoundBook(null);
          toast.error('Book not found in any database.');
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      toast.error('Failed to look up book');
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    // Camera implementation would go here in a real environment
    // For now, we'll keep the simulation but make it more realistic
    setMode('camera');
    setScanning(true);
    setTimeout(() => {
      // Simulation: pick a real ISBN
      const demoIsbns = ['9780132350884', '9780201633610', '9780262033848'];
      const randomIsbn = demoIsbns[Math.floor(Math.random() * demoIsbns.length)];
      setBarcode(randomIsbn);
      setScanning(false);
      handleScan();
    }, 2000);
  };

  const handleAddBook = async () => {
    if (!foundBook) return;
    setLoading(true);
    try {
      await booksApi.create({
        title: foundBook.title,
        author: foundBook.author,
        isbn: foundBook.isbn,
        category: foundBook.category,
        publisher: foundBook.publisher,
        year: foundBook.year,
        pages: foundBook.pages,
        available: true
      });
      toast.success('Book successfully added to library catalog!');
      setFoundBook(null);
      setBarcode('');
    } catch (err) {
      console.error('Add book error:', err);
      toast.error('Failed to add book to catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueBook = () => {
    if (!foundBook) return;
    if (foundBook.source === 'external') {
      toast.error('You must add the book to the catalog first before issuing.');
      return;
    }
    // Redirect to issue page with book pre-selected
    navigate('/admin/issue', { state: { bookId: foundBook.id } });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Barcode Scanner" description="Scan book barcodes to auto-fill details for adding or issuing books" />

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-3">
          <LibButton variant={mode === 'camera' ? 'primary' : 'ghost'} onClick={startCamera} className="flex items-center gap-2">
            <Camera className="h-4 w-4" /> Camera Scan
          </LibButton>
          <LibButton variant={mode === 'manual' ? 'primary' : 'ghost'} onClick={() => setMode('manual')} className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" /> Manual Entry
          </LibButton>
        </div>

        {/* Camera View */}
        {mode === 'camera' && (
          <LibCard className="relative overflow-hidden">
            <div className="bg-secondary rounded-lg h-64 flex items-center justify-center">
              {scanning ? (
                <div className="text-center space-y-3">
                  <div className="w-48 h-1 bg-accent animate-pulse mx-auto rounded" />
                  <p className="text-sm text-muted-foreground animate-pulse">Scanning barcode...</p>
                  <div className="border-2 border-dashed border-accent/50 w-48 h-32 mx-auto rounded-lg flex items-center justify-center">
                    <Camera className="h-8 w-8 text-accent/50" />
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <Camera className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">Camera preview area</p>
                  <LibButton size="sm" onClick={startCamera}>Start Scanning</LibButton>
                </div>
              )}
            </div>
            <video ref={videoRef} className="hidden" />
          </LibCard>
        )}

        {/* Manual Entry */}
        {mode === 'manual' && (
          <LibCard>
            <h3 className="text-sm font-semibold text-foreground mb-3">Enter ISBN / Barcode</h3>
            <div className="flex gap-3">
              <input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="e.g., 9780132350884"
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <LibButton onClick={handleScan} disabled={loading} className="flex items-center gap-2">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Look Up
              </LibButton>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <p className="text-xs text-muted-foreground w-full mb-1">Try these demo ISBNs:</p>
              {['9780132350884', '9780201633610', '9780262033848'].map((isbn) => (
                <button key={isbn} onClick={() => { setBarcode(isbn); }} className="text-xs px-2 py-1 rounded bg-secondary text-foreground hover:bg-secondary/80">
                  {isbn}
                </button>
              ))}
            </div>
          </LibCard>
        )}

        {/* Book Details */}
        {foundBook && (
          <LibCard className="border-accent/50">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" /> Book Found {foundBook.source === 'library' && <LibBadge variant="available">In Catalog</LibBadge>}
              </h3>
              <LibBadge variant="default">{foundBook.category}</LibBadge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Title', foundBook.title],
                ['Author', foundBook.author],
                ['ISBN', foundBook.isbn],
                ['Publisher', foundBook.publisher],
                ['Year', String(foundBook.year)],
                ['Pages', String(foundBook.pages)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              {foundBook.source === 'external' ? (
                <LibButton onClick={handleAddBook} disabled={loading} className="flex items-center gap-2">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add to Catalog
                </LibButton>
              ) : (
                <LibButton onClick={handleIssueBook} className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Issue This Book
                </LibButton>
              )}
              <LibButton variant="ghost" onClick={() => setFoundBook(null)} className="flex items-center gap-2">
                Cancel
              </LibButton>
            </div>
          </LibCard>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
