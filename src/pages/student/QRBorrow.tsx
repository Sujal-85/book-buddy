import React, { useState } from 'react';
import { QrCode, Camera, BookOpen, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import toast from 'react-hot-toast';

const QRBorrow: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedBook, setScannedBook] = useState<null | { title: string; author: string; isbn: string; shelf: string }>(null);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScannedBook({ title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', shelf: 'B2-Row1' });
      toast.success('QR Code scanned!');
    }, 2000);
  };

  const recentScans = [
    { title: 'Design Patterns', date: '2025-03-28', action: 'Borrowed' },
    { title: 'The Pragmatic Programmer', date: '2025-03-25', action: 'Returned' },
    { title: 'Refactoring', date: '2025-03-20', action: 'Borrowed' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="QR Code Quick Borrow" description="Scan book QR codes for instant borrowing" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Scanner */}
        <LibCard className="text-center space-y-4">
          <div className="bg-secondary rounded-lg h-64 flex items-center justify-center mx-auto max-w-sm">
            {scanning ? (
              <div className="space-y-3">
                <div className="w-32 h-32 border-2 border-accent rounded-lg mx-auto flex items-center justify-center relative">
                  <div className="absolute inset-0 border-t-2 border-accent animate-pulse" style={{ top: '50%' }} />
                  <QrCode className="h-12 w-12 text-accent/50" />
                </div>
                <p className="text-sm text-foreground animate-pulse">Scanning...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <QrCode className="h-16 w-16 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Point your camera at a book's QR code</p>
              </div>
            )}
          </div>
          <LibButton onClick={handleScan} disabled={scanning} className="flex items-center gap-2 mx-auto">
            <Camera className="h-4 w-4" /> {scanning ? 'Scanning...' : 'Start Scanning'}
          </LibButton>
        </LibCard>

        {/* Scanned Book */}
        {scannedBook && (
          <LibCard className="border-accent/50 space-y-3">
            <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><h3 className="text-sm font-semibold text-foreground">Book Detected</h3></div>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">Title</p><p className="text-sm font-medium text-foreground">{scannedBook.title}</p></div>
              <div><p className="text-xs text-muted-foreground">Author</p><p className="text-sm font-medium text-foreground">{scannedBook.author}</p></div>
              <div><p className="text-xs text-muted-foreground">ISBN</p><p className="text-sm font-medium text-foreground">{scannedBook.isbn}</p></div>
              <div><p className="text-xs text-muted-foreground">Shelf</p><p className="text-sm font-medium text-foreground">{scannedBook.shelf}</p></div>
            </div>
            <LibButton className="w-full" onClick={() => { toast.success('Book borrowed successfully!'); setScannedBook(null); }}>Confirm Borrow</LibButton>
          </LibCard>
        )}

        {/* Recent Scans */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Scans</h3>
          <div className="space-y-2">
            {recentScans.map((s) => (
              <LibCard key={s.title} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm font-medium text-foreground">{s.title}</p><p className="text-xs text-muted-foreground">{s.date}</p></div>
                </div>
                <span className={`text-xs font-medium ${s.action === 'Borrowed' ? 'text-accent' : 'text-green-500'}`}>{s.action}</span>
              </LibCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRBorrow;
