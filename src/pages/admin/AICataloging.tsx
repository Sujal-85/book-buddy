import React, { useState } from 'react';
import { Brain, Wand2, Tag, BookOpen, Sparkles } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const AICataloging: React.FC = () => {
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<null | { dewey: string; subjects: string[]; keywords: string[]; description: string; suggestedShelf: string }>(null);

  const handleGenerate = () => {
    if (!title.trim()) { toast.error('Enter a book title'); return; }
    setGenerating(true);
    setTimeout(() => {
      setResult({
        dewey: '005.133',
        subjects: ['Computer Programming', 'Software Development', 'Best Practices'],
        keywords: ['clean code', 'refactoring', 'software craftsmanship', 'SOLID principles', 'code quality'],
        description: 'A handbook of agile software craftsmanship that covers best practices for writing clean, maintainable code. Focuses on naming conventions, functions, comments, formatting, error handling, and test-driven development.',
        suggestedShelf: 'Shelf B3 — Programming & Software Engineering',
      });
      setGenerating(false);
      toast.success('AI cataloging complete!');
    }, 2000);
  };

  const recentCatalogs = [
    { title: 'Artificial Intelligence: A Modern Approach', dewey: '006.3', status: 'cataloged' },
    { title: 'Computer Networks', dewey: '004.6', status: 'cataloged' },
    { title: 'Operating System Concepts', dewey: '005.43', status: 'pending' },
    { title: 'Digital Signal Processing', dewey: '621.382', status: 'cataloged' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="AI Cataloging Assistant" description="Auto-classify and catalog books using AI-powered Dewey Decimal classification" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        <LibCard>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Wand2 className="h-4 w-4 text-accent" /> Auto-Catalog a Book</h3>
          <div className="flex gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter book title (e.g., Clean Code)" className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <LibButton onClick={handleGenerate} disabled={generating} className="flex items-center gap-2">
              {generating ? <><Sparkles className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Brain className="h-4 w-4" /> Catalog</>}
            </LibButton>
          </div>
        </LibCard>

        {result && (
          <LibCard className="border-accent/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> AI Classification Result</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Dewey Decimal</p><p className="text-lg font-bold text-accent">{result.dewey}</p></div>
              <div><p className="text-xs text-muted-foreground">Suggested Shelf</p><p className="text-sm font-medium text-foreground">{result.suggestedShelf}</p></div>
            </div>
            <div><p className="text-xs text-muted-foreground mb-1">Subjects</p><div className="flex flex-wrap gap-1">{result.subjects.map((s) => <LibBadge key={s}>{s}</LibBadge>)}</div></div>
            <div><p className="text-xs text-muted-foreground mb-1">Keywords</p><div className="flex flex-wrap gap-1">{result.keywords.map((k) => <span key={k} className="text-xs px-2 py-0.5 rounded bg-secondary text-foreground">{k}</span>)}</div></div>
            <div><p className="text-xs text-muted-foreground mb-1">AI Description</p><p className="text-sm text-foreground">{result.description}</p></div>
            <LibButton onClick={() => { toast.success('Cataloging saved!'); setResult(null); setTitle(''); }}>Save Cataloging</LibButton>
          </LibCard>
        )}

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Recently Cataloged</h3>
          <div className="space-y-2">
            {recentCatalogs.map((b) => (
              <LibCard key={b.title} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div><p className="text-sm font-medium text-foreground">{b.title}</p><p className="text-xs text-muted-foreground">DDC: {b.dewey}</p></div>
                </div>
                <LibBadge variant={b.status === 'cataloged' ? 'available' : 'default'}>{b.status}</LibBadge>
              </LibCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICataloging;
