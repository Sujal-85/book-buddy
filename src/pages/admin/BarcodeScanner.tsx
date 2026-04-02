import React, { useState, useRef } from 'react';
import { Camera, Keyboard, BookOpen, Search, Plus, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const mockBookLookup: Record<string, { title: string; author: string; isbn: string; category: string; publisher: string; year: number; pages: number; }> = {
  '9780132350884': { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Programming', publisher: 'Prentice Hall', year: 2008, pages: 464 },
  '9780201633610': { title: 'Design Patterns', author: 'Gang of Four', isbn: '9780201633610', category: 'Programming', publisher: 'Addison-Wesley', year: 1994, pages: 416 },
  '9780262033848': { title: 'Introduction to Algorithms', author: 'Thomas Cormen', isbn: '9780262033848', category: 'Computer Science', publisher: 'MIT Press', year: 2009, pages: 1312 },
  '9780596007126': { title: 'Head First Design Patterns', author: 'Eric Freeman', isbn: '9780596007126', category: 'Programming', publisher: "O'Reilly", year: 2004, pages: 694 },
  '9780134685991': { title: 'Effective Java', author: 'Joshua Bloch', isbn: '9780134685991', category: 'Programming', publisher: 'Addison-Wesley', year: 2018, pages: 416 },
};

const BarcodeScanner: React.FC = () => {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [foundBook, setFoundBook] = useState<typeof mockBookLookup[string] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleScan = () => {
    if (!barcode.trim()) { toast.error('Please enter a barcode/ISBN'); return; }
    const book = mockBookLookup[barcode.trim()];
    if (book) {
      setFoundBook(book);
      toast.success('Book found!');
    } else {
      setFoundBook(null);
      toast.error('Book not found. You can add it as a new book.');
    }
  };

  const startCamera = async () => {
    setMode('camera');
    setScanning(true);
    // Simulate camera scanning
    setTimeout(() => {
      const isbns = Object.keys(mockBookLookup);
      const randomIsbn = isbns[Math.floor(Math.random() * isbns.length)];
      setBarcode(randomIsbn);
      setFoundBook(mockBookLookup[randomIsbn]);
      setScanning(false);
      toast.success('Barcode scanned successfully!');
    }, 2000);
  };

  const handleAddBook = () => {
    toast.success('Book added to library catalog!');
    setFoundBook(null);
    setBarcode('');
  };

  const handleIssueBook = () => {
    toast.success('Book issued successfully!');
    setFoundBook(null);
    setBarcode('');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Barcode Scanner" description="Scan book barcodes to auto-fill details for adding or issuing books" />

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Mode Selection */}
        <div className="flex gap-3">
          <LibButton variant={mode === 'camera' ? 'primary' : 'outline'} onClick={startCamera} className="flex items-center gap-2">
            <Camera className="h-4 w-4" /> Camera Scan
          </LibButton>
          <LibButton variant={mode === 'manual' ? 'primary' : 'outline'} onClick={() => setMode('manual')} className="flex items-center gap-2">
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
              <LibButton onClick={handleScan} className="flex items-center gap-2">
                <Search className="h-4 w-4" /> Look Up
              </LibButton>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <p className="text-xs text-muted-foreground w-full mb-1">Try these demo ISBNs:</p>
              {Object.keys(mockBookLookup).map((isbn) => (
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
                <CheckCircle className="h-4 w-4 text-green-500" /> Book Found
              </h3>
              <LibBadge variant="available">{foundBook.category}</LibBadge>
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
              <LibButton onClick={handleAddBook} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add to Catalog
              </LibButton>
              <LibButton variant="outline" onClick={handleIssueBook} className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Issue This Book
              </LibButton>
            </div>
          </LibCard>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
