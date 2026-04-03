import React, { useEffect, useState, useRef } from 'react';
import { QrCode, Camera, ShieldCheck, AlertCircle, Loader2, BookOpen, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useIssueBook } from '@/hooks/useBorrow';
import { addDays } from 'date-fns';
import { useBooks } from '@/hooks/useBooks';

const QRBorrow: React.FC = () => {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBook, setScannedBook] = useState<any | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { user } = useAuth();
  const { data: booksData } = useBooks();
  const issueMutation = useIssueBook();

  const books = booksData?.data || [];

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  function onScanSuccess(decodedText: string) {
    setScanResult(decodedText);
    setIsScanning(false);
    
    // Standardized QR format: BOOK_ID:<id> or ISBN:<isbn> or just ID/ISBN
    let processedText = decodedText;
    if (decodedText.startsWith('BOOK_ID:')) {
      processedText = decodedText.replace('BOOK_ID:', '');
    } else if (decodedText.startsWith('ISBN:')) {
      processedText = decodedText.replace('ISBN:', '');
    }

    const book = books.find((b: any) => 
      b.id === processedText || 
      b.isbn === processedText || 
      b.id === decodedText ||
      b.isbn === decodedText
    );

    if (book) {
      setScannedBook(book);
      toast.success(`Book identified: ${book.title}`);
    } else {
      toast.error("Book not found in our database");
    }

    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error("Scanner clear error", err));
      scannerRef.current = null;
    }
  }

  function onScanFailure(error: any) {
    // silently fail or handle specific errors
  }

  const handleBorrow = () => {
    if (!scannedBook || !user) return;
    
    issueMutation.mutate({
      studentId: user.uid,
      bookId: scannedBook.id,
      dueDate: addDays(new Date(), 14).toISOString(),
    }, {
      onSuccess: () => {
        setScannedBook(null);
        setScanResult(null);
      }
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Instant QR Borrow" description="Scan book QR codes to borrow instantly without browsing" />
      
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Camera className="h-4 w-4 text-accent" />
              Scanner View
            </h3>
            
            <LibCard className="aspect-square relative overflow-hidden bg-black/5 flex items-center justify-center border-2 border-dashed border-border/50 rounded-3xl">
              {isScanning ? (
                <div id="qr-reader" className="w-full h-full" />
              ) : (
                <div className="text-center p-8 space-y-6">
                  <div className="relative inline-block">
                    <div className="h-24 w-24 bg-accent/10 rounded-3xl flex items-center justify-center animate-pulse">
                      <QrCode className="h-12 w-12 text-accent" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1.5 border-4 border-card shadow-lg">
                      <ShieldCheck className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-foreground uppercase tracking-tight">Ready to Scan</h4>
                    <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">Position the book's QR code within the frame to identify it.</p>
                  </div>
                  <LibButton 
                    onClick={() => setIsScanning(true)} 
                    className="px-10 py-6 rounded-2xl shadow-xl shadow-accent/20 font-black tracking-widest uppercase text-xs"
                  >
                    Activate Camera
                  </LibButton>
                </div>
              )}
            </LibCard>

            <div className="flex items-center gap-3 p-4 bg-accent/5 rounded-2xl border border-accent/10">
              <AlertCircle className="h-5 w-5 text-accent shrink-0" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                QR codes are usually found on the inside cover or the first page of our library books.
              </p>
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              Identification Result
            </h3>

            {scannedBook ? (
              <LibCard className="p-8 space-y-8 animate-in zoom-in-95 duration-300 border-accent/40 bg-accent/5 ring-1 ring-accent/20">
                <div className="flex gap-6">
                  <div className="w-32 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0">
                    <img 
                      src={scannedBook.cover || "https://images.unsplash.com/photo-1543004407-33d83b0f5b49?q=80&w=300&auto=format&fit=crop"} 
                      alt={scannedBook.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <LibBadge variant={scannedBook.available ? 'available' : 'issued'} className="mb-2">
                        {scannedBook.available ? 'Available' : 'Unavailable'}
                      </LibBadge>
                      <h2 className="text-2xl font-black text-foreground tracking-tight leading-tight">{scannedBook.title}</h2>
                      <p className="text-sm text-muted-foreground font-medium">by {scannedBook.author}</p>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-accent uppercase tracking-widest">Category</p>
                      <p className="text-xs font-bold text-foreground">{scannedBook.category}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-accent/10">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Borrowing Period</span>
                    <span className="text-foreground">14 Days</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Due Date</span>
                    <span className="text-foreground">{addDays(new Date(), 14).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <LibButton 
                    onClick={handleBorrow}
                    loading={issueMutation.isPending}
                    disabled={!scannedBook.available}
                    className="w-full py-7 rounded-2xl shadow-2xl shadow-accent/30 text-lg font-black tracking-tighter"
                  >
                    Confirm & Borrow Now
                  </LibButton>
                  <LibButton 
                    variant="ghost" 
                    onClick={() => { setScannedBook(null); setScanResult(null); }}
                    className="text-xs font-bold text-muted-foreground uppercase tracking-widest"
                  >
                    Scan Different Book
                  </LibButton>
                </div>
              </LibCard>
            ) : scanResult && !scannedBook ? (
              <LibCard className="p-12 text-center space-y-6 bg-red-500/5 border-red-500/20">
                <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-foreground uppercase tracking-tight">Unrecognized Code</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The code "<span className="font-mono text-accent">{scanResult}</span>" was scanned but doesn't match any books in our current catalog.
                  </p>
                </div>
                <LibButton variant="secondary" onClick={() => { setScanResult(null); setIsScanning(true); }} className="px-8">
                  Try Again
                </LibButton>
              </LibCard>
            ) : (
              <LibCard className="p-12 text-center space-y-4 border-dashed border-border/50 bg-secondary/5">
                <div className="h-16 w-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto opacity-30">
                  <QrCode className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Awaiting Scan...</p>
              </LibCard>
            )}

            {/* Recent Scans (Simulator) */}
            <div className="pt-8">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Security Verified Scanners</h4>
              <div className="flex flex-wrap gap-2">
                 <LibBadge variant="outline" className="opacity-50 text-[9px] px-3">ENC-SYS-01</LibBadge>
                 <LibBadge variant="outline" className="opacity-50 text-[9px] px-3">CAM-FRONT-A2</LibBadge>
                 <LibBadge variant="outline" className="opacity-100 text-[9px] px-3 border-accent text-accent">USER-V-4172</LibBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRBorrow;
