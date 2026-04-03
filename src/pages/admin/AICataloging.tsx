import React, { useState } from 'react';
import { Brain, Wand2, Tag, BookOpen, Sparkles } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';
import { generateCatalogData, CatalogData } from '@/services/aiBackend';
import { searchBooks } from '@/lib/googleBooks';

const AICataloging: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<CatalogData | null>(null);

  const handleGenerate = async () => {
    if (!title.trim()) { toast.error('Enter a book title'); return; }
    setGenerating(true);
    
    // Always have fallback book info from user input
    let bookInfo: { title: string; author: string; description?: string; isbn?: string } = {
      title,
      author: author || 'Unknown Author'
    };
    
    try {
      // Try to get extra data from Google Books for more context (optional)
      try {
        const googleBooks = await searchBooks(title);
        if (googleBooks.length > 0) {
          const book = googleBooks[0].volumeInfo;
          bookInfo = {
            title: book.title || title,
            author: book.authors?.[0] || author || 'Unknown Author',
            description: book.description,
            isbn: book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier
          };
        }
      } catch (googleErr) {
        // Google Books failed or book not found - continue with user input only
        console.log('Google Books lookup failed, using user input only');
      }
      
      // Call AI backend for cataloging (works with or without Google Books data)
      const catalogData = await generateCatalogData(bookInfo);
      setResult(catalogData);
      toast.success('AI cataloging complete!');
    } catch (err) {
      console.error('Cataloging error:', err);
      toast.error('Error generating catalog data');
    } finally {
      setGenerating(false);
    }
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
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter book title (e.g., Clean Code)" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="mt-3">
            <LibButton onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 w-full">
              {generating ? <><Sparkles className="h-4 w-4 animate-spin" /> Analyzing...</> : <><Brain className="h-4 w-4" /> Generate AI Catalog Data</>}
            </LibButton>
          </div>
        </LibCard>

        {result && (
          <LibCard className="border-accent/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> AI Classification Result</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Primary Genre</p><p className="text-lg font-bold text-accent">{result.genre}</p></div>
              <div><p className="text-xs text-muted-foreground">Suggested Shelf</p><p className="text-sm font-medium text-foreground">{result.suggestedShelfLocation}</p></div>
            </div>
            <div><p className="text-xs text-muted-foreground mb-1">Target Audience</p><p className="text-sm font-medium text-foreground capitalize">{result.targetAudience}</p></div>
            <div><p className="text-xs text-muted-foreground mb-1">Subjects</p><div className="flex flex-wrap gap-1">{result.subjects.map((s) => <LibBadge key={s}>{s}</LibBadge>)}</div></div>
            <div><p className="text-xs text-muted-foreground mb-1">Keywords</p><div className="flex flex-wrap gap-1">{result.keywords.map((k) => <span key={k} className="text-xs px-2 py-0.5 rounded bg-secondary text-foreground">{k}</span>)}</div></div>
            <div><p className="text-xs text-muted-foreground mb-1">AI Summary</p><p className="text-sm text-foreground">{result.summary}</p></div>
            <LibButton onClick={() => { toast.success('Cataloging saved!'); setResult(null); setTitle(''); setAuthor(''); }}>Save Cataloging</LibButton>
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
