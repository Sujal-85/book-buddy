import React, { useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, QrCode, Loader2 } from 'lucide-react';

interface QRCodeProps {
  bookId: string;
  isbn?: string;
  title: string;
  size?: number;
}

const QRCodeComponent: React.FC<QRCodeProps> = ({ bookId, isbn, title, size = 200 }) => {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  
  // QR code data format: BOOK_ID:<id> for scanning
  const qrValue = `BOOK_ID:${bookId}`;
  
  const generateQR = useCallback(async () => {
    if (!open || qrDataUrl) return;
    
    setGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(qrValue, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'H', // High error correction for better scanning
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    } finally {
      setGenerating(false);
    }
  }, [open, qrValue, size, qrDataUrl]);
  
  // Generate QR when dialog opens
  React.useEffect(() => {
    if (open) {
      generateQR();
    }
  }, [open, generateQR]);
  
  const handlePrint = () => {
    if (!qrDataUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Book QR Code - ${title}</title>
          <style>
            @media print {
              body { 
                display: flex; 
                flex-direction: column;
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                font-family: Arial, sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .qr-container {
                text-align: center;
                border: 2px solid #333;
                padding: 20px;
                border-radius: 10px;
                background: white;
              }
              .book-title { 
                font-size: 18px; 
                font-weight: bold; 
                margin-bottom: 10px;
                max-width: 300px;
                word-wrap: break-word;
              }
              .book-id {
                font-size: 12px;
                color: #666;
                margin-top: 10px;
              }
              .library-label {
                font-size: 14px;
                color: #999;
                margin-top: 5px;
                margin-bottom: 10px;
              }
            }
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              border: 2px solid #333;
              padding: 20px;
              border-radius: 10px;
              background: white;
            }
            .book-title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 10px;
              max-width: 300px;
              word-wrap: break-word;
            }
            .book-id {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
            }
            .library-label {
              font-size: 14px;
              color: #999;
              margin-top: 5px;
              margin-bottom: 10px;
            }
            img {
              width: ${size}px;
              height: ${size}px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="library-label">LIBRARY BOOK QR CODE</div>
            <div class="book-title">${title}</div>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="book-id">ID: ${bookId}</div>
            ${isbn ? `<div class="book-id">ISBN: ${isbn}</div>` : ''}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 200);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    
    const downloadLink = document.createElement('a');
    downloadLink.download = `QR-${bookId}.png`;
    downloadLink.href = qrDataUrl;
    downloadLink.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {generating ? (
            <div className="flex flex-col items-center space-y-2 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Generating QR Code...</p>
            </div>
          ) : qrDataUrl ? (
            <>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <img 
                  src={qrDataUrl} 
                  alt={`QR Code for ${title}`}
                  width={size}
                  height={size}
                  className="block"
                />
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-sm truncate max-w-[250px]">{title}</p>
                <p className="text-xs text-muted-foreground font-mono">ID: {bookId}</p>
                {isbn && <p className="text-xs text-muted-foreground font-mono">ISBN: {isbn}</p>}
              </div>
              <div className="flex gap-2 w-full">
                <Button onClick={handlePrint} variant="outline" className="flex-1 flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Print this QR code and stick it on the book for easy scanning
              </p>
            </>
          ) : (
            <p className="text-sm text-red-500">Failed to generate QR code</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeComponent;
