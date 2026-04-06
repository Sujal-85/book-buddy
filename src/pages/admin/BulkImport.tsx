import React, { useState, useEffect } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Sparkles, RefreshCw, FileText } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import aiBackend from '@/services/aiBackend';
import { booksApi } from '@/services/api';
import toast from 'react-hot-toast';

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
  timestamp: string;
}

const BulkImport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [recentImports, setRecentImports] = useState<ImportResult[]>(() => {
    const saved = localStorage.getItem('admin_bulk_imports');
    return saved ? JSON.parse(saved) : [
      { total: 85, success: 85, failed: 0, errors: [], timestamp: '2025-03-25' },
      { total: 200, success: 193, failed: 7, errors: ['Row 12: Missing ISBN'], timestamp: '2025-03-15' },
    ];
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      // 1. Read file content
      const reader = new FileReader();
      const content = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
      });

      // 2. Call AI processing
      const format = file.name.endsWith('.json') ? 'json' : file.name.endsWith('.csv') ? 'csv' : 'text';
      const result = await aiBackend.bulkImport(content, format as any, {
        userId: 'admin',
        subType: 'file_import',
        prompt: `Bulk import from file: ${file.name}`
      });
      
      // 3. Process results and save to DB
      const successes = result.filter(r => r.status === 'valid');
      const failures = result.filter(r => r.status !== 'valid');

      // Actually create books in DB for valid entries
      if (successes.length > 0) {
        await Promise.all(successes.map(book => 
          booksApi.create({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            summary: book.description,
            category: book.genre || 'General'
          })
        ));
      }

      const newImport: ImportResult = {
        total: result.length,
        success: successes.length,
        failed: failures.length,
        errors: failures.map(f => `${f.title}: ${f.issues?.join(', ') || 'Validation failed'}`),
        timestamp: new Date().toISOString().split('T')[0]
      };

      setImportResult(newImport);
      const updated = [newImport, ...recentImports.slice(0, 4)];
      setRecentImports(updated);
      localStorage.setItem('admin_bulk_imports', JSON.stringify(updated));
      toast.success(`AI processing complete: ${newImport.success}/${newImport.total} records imported.`);
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Failed to process bulk import');
    } finally {
      setImporting(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="AI Bulk Cataloging" description="Agentic file processing for automated library data entry" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Import Area */}
          <div className="lg:col-span-2 space-y-6">
            <LibCard>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Import Engine</h3>
                    <p className="text-[10px] text-muted-foreground font-bold">SUPPORTED: .CSV, .JSON, .TXT</p>
                  </div>
                </div>
                <LibButton variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-tighter">
                  <Download className="h-3 w-3 mr-1.5" /> Get Template
                </LibButton>
              </div>

              <div 
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 relative ${
                  importing ? 'border-accent bg-accent/5' : 'border-border bg-secondary/10 hover:border-accent/30'
                }`}
              >
                <input 
                  type="file" 
                  accept=".csv,.json,.txt"
                  onChange={handleImport}
                  disabled={importing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                {importing ? (
                  <div className="space-y-6">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
                      <div className="relative z-10 w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
                        <RefreshCw className="h-10 w-10 text-accent animate-spin" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-black text-foreground uppercase tracking-widest">Processing Dataset...</p>
                      <p className="text-[10px] text-muted-foreground font-bold italic">AI Agent is verifying ISBNs and categorizing metadata</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      <Upload className="h-10 w-10 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground uppercase tracking-widest">Upload Data Source</p>
                      <p className="text-xs text-muted-foreground mt-1">Click or drag your spreadsheet (.csv, .json, .txt)</p>
                    </div>
                  </div>
                )}
              </div>
            </LibCard>

            {importResult && (
              <LibCard className="border-accent/40 bg-accent/5 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Processing Report
                  </h3>
                  <LibBadge variant="default" className="bg-accent/10 text-accent border-none">{importResult.timestamp}</LibBadge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-background/50 rounded-xl border border-border/50 text-center">
                    <p className="text-2xl font-black text-foreground">{importResult.total}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Total Scanned</p>
                  </div>
                  <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/20 text-center">
                    <p className="text-2xl font-black text-green-500">{importResult.success}</p>
                    <p className="text-[10px] font-bold text-green-600/80 uppercase tracking-tighter">Synchronized</p>
                  </div>
                  <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/20 text-center">
                    <p className="text-2xl font-black text-red-500">{importResult.failed}</p>
                    <p className="text-[10px] font-bold text-red-600/80 uppercase tracking-tighter">Validation Errors</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2 bg-background/40 p-4 rounded-xl border border-border">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Error Manifest
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                      {importResult.errors.map((error, idx) => (
                        <p key={idx} className="text-[10px] text-muted-foreground font-mono bg-red-500/5 p-1.5 rounded">{error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </LibCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <LibCard>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">Export Catalog</h3>
              <div className="space-y-2">
                {[
                  { label: 'Full Collection', count: '12,450', color: 'text-blue-500' },
                  { label: 'Issued Logs', count: '890', color: 'text-orange-500' },
                  { label: 'Member Database', count: '2,100', color: 'text-green-500' }
                ].map((item) => (
                  <button key={item.label} className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors border border-transparent hover:border-border group">
                    <div className="flex items-center gap-3">
                      <FileText className={`h-4 w-4 ${item.color}`} />
                      <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-foreground/50">{item.count}</span>
                  </button>
                ))}
              </div>
            </LibCard>

            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-foreground px-1 mb-4">Audit Logs</h3>
              <div className="space-y-3">
                {recentImports.map((r, idx) => (
                  <div key={idx} className="p-4 bg-background border border-border rounded-2xl flex items-center justify-between hover:border-accent/40 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-tighter">AI LOG #{1000 + idx}</p>
                        <p className="text-[9px] text-muted-foreground font-bold">{r.timestamp}</p>
                      </div>
                    </div>
                    <LibBadge variant="available" className="text-[9px] font-black px-2">{r.success} OK</LibBadge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
