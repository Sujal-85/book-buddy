import React, { useState } from 'react';
import { FileText, BookOpen, Sparkles, Copy } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import toast from 'react-hot-toast';

const AISummary: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState('');
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<null | { title: string; keyPoints: string[]; summary: string; difficulty: string; readTime: string }>(null);

  const books = ['Clean Code', 'Design Patterns', 'Introduction to Algorithms', 'The Pragmatic Programmer', 'Artificial Intelligence'];

  const handleGenerate = () => {
    if (!selectedBook) { toast.error('Select a book'); return; }
    setGenerating(true);
    setTimeout(() => {
      setSummary({
        title: selectedBook,
        keyPoints: [
          'Code should be readable and self-documenting',
          'Functions should be small and do one thing well',
          'Meaningful names are crucial for code clarity',
          'Error handling should use exceptions over return codes',
          'Unit tests are essential — follow TDD principles',
        ],
        summary: 'This book presents a comprehensive guide to writing clean, maintainable code. Robert C. Martin draws on decades of experience to share practical advice on naming conventions, function design, code formatting, error handling, and testing. The book emphasizes that writing clean code is a professional responsibility and provides concrete techniques for improving code quality at every level.',
        difficulty: 'Intermediate',
        readTime: '~8 hours',
      });
      setGenerating(false);
      toast.success('Summary generated!');
    }, 2500);
  };

  const pastSummaries = [
    { title: 'Design Patterns', date: '2025-03-25' },
    { title: 'Operating System Concepts', date: '2025-03-20' },
    { title: 'Database System Concepts', date: '2025-03-15' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="AI Book Summary Generator" description="Get instant AI-generated summaries and key takeaways" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Generate */}
        <LibCard className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Generate Summary</h3>
          <div className="flex gap-3">
            <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)} className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select a book...</option>
              {books.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <LibButton onClick={handleGenerate} disabled={generating}>
              {generating ? <><Sparkles className="h-4 w-4 animate-spin mr-1" /> Generating...</> : 'Summarize'}
            </LibButton>
          </div>
        </LibCard>

        {/* Summary Result */}
        {summary && (
          <LibCard className="border-accent/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{summary.title}</h3>
              <button onClick={() => { navigator.clipboard.writeText(summary.summary); toast.success('Copied!'); }} className="text-muted-foreground hover:text-foreground"><Copy className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>📖 Difficulty: {summary.difficulty}</span>
              <span>⏱️ Read time: {summary.readTime}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Key Takeaways</p>
              <ul className="space-y-1">{summary.keyPoints.map((p, i) => <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-accent">•</span> {p}</li>)}</ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Summary</p>
              <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>
            </div>
          </LibCard>
        )}

        {/* Past Summaries */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Past Summaries</h3>
          <div className="space-y-2">
            {pastSummaries.map((s) => (
              <LibCard key={s.title} className="flex items-center justify-between cursor-pointer hover:border-accent/50">
                <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-accent" /><div><p className="text-sm font-medium text-foreground">{s.title}</p><p className="text-xs text-muted-foreground">{s.date}</p></div></div>
                <LibButton size="sm" variant="ghost">View</LibButton>
              </LibCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISummary;
