import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const BulkImport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<null | { total: number; success: number; failed: number; errors: string[] }>(null);

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImportResult({ total: 150, success: 142, failed: 8, errors: ['Row 23: Missing ISBN', 'Row 45: Duplicate entry', 'Row 67: Invalid category', 'Row 89: Missing author', 'Row 102: Invalid year format', 'Row 115: ISBN checksum invalid', 'Row 128: Title too long', 'Row 141: Missing publisher'] });
      setImporting(false);
      toast.success('Import completed with 142/150 books added!');
    }, 3000);
  };

  const recentImports = [
    { date: '2025-03-25', file: 'new_arrivals_march.xlsx', total: 85, success: 85 },
    { date: '2025-03-15', file: 'donated_books.csv', total: 200, success: 193 },
    { date: '2025-02-28', file: 'journal_update.xlsx', total: 50, success: 48 },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Bulk Import / Export" description="Import books from Excel/CSV files or export your catalog" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Import */}
          <LibCard className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Upload className="h-4 w-4 text-accent" /> Import Books</h3>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              {importing ? (
                <div className="space-y-3">
                  <FileSpreadsheet className="h-10 w-10 text-accent mx-auto animate-pulse" />
                  <p className="text-sm text-foreground">Processing file...</p>
                  <div className="w-full h-2 bg-secondary rounded-full"><div className="h-2 bg-accent rounded-full animate-pulse" style={{ width: '70%' }} /></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-foreground">Drop Excel/CSV file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">Supports .xlsx, .xls, .csv formats</p>
                  <LibButton onClick={handleImport}>Select & Import File</LibButton>
                </div>
              )}
            </div>
            <LibButton variant="ghost" size="sm" className="w-full flex items-center gap-2 justify-center"><Download className="h-4 w-4" /> Download Template</LibButton>
          </LibCard>

          {/* Export */}
          <LibCard className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Download className="h-4 w-4 text-accent" /> Export Catalog</h3>
            <div className="space-y-3">
              {['Full Catalog (37,419 books)', 'Available Books Only', 'Issued Books Only', 'Overdue Records', 'Member Directory'].map((item) => (
                <LibButton key={item} variant="ghost" className="w-full justify-start text-left" size="sm" onClick={() => toast.success(`Exporting: ${item}`)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> {item}
                </LibButton>
              ))}
            </div>
          </LibCard>
        </div>

        {/* Import Result */}
        {importResult && (
          <LibCard className="border-accent/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">Import Result</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-secondary rounded-lg"><p className="text-lg font-bold text-foreground">{importResult.total}</p><p className="text-xs text-muted-foreground">Total Rows</p></div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"><p className="text-lg font-bold text-green-600">{importResult.success}</p><p className="text-xs text-muted-foreground">Imported</p></div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"><p className="text-lg font-bold text-red-600">{importResult.failed}</p><p className="text-xs text-muted-foreground">Failed</p></div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="space-y-1">{importResult.errors.map((e) => <p key={e} className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {e}</p>)}</div>
            )}
          </LibCard>
        )}

        {/* Recent Imports */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Imports</h3>
          <div className="space-y-2">
            {recentImports.map((r) => (
              <LibCard key={r.date} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm font-medium text-foreground">{r.file}</p><p className="text-xs text-muted-foreground">{r.date}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <LibBadge variant="available">{r.success}/{r.total} imported</LibBadge>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </LibCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
