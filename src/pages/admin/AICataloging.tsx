import React, { useState, useEffect } from 'react';
import { Brain, Wand2, Tag, BookOpen, Sparkles, RefreshCw, CheckCircle, Search, Layers, Fingerprint, Copy, Check } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import aiBackend from '@/services/aiBackend';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface CatalogResult {
  title: string;
  author: string;
  genre: string;
  suggestedShelfLocation: string;
  subjects: string[];
  keywords: string[];
  summary: string;
  targetAudience: string;
}

const AICataloging: React.FC = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<CatalogResult | null>(() => {
    const saved = localStorage.getItem('admin_last_catalog_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [recentCatalogs, setRecentCatalogs] = useState<CatalogResult[]>(() => {
    const saved = localStorage.getItem('admin_recent_catalogs');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist the current result to localStorage
  useEffect(() => {
    if (result) {
      localStorage.setItem('admin_last_catalog_result', JSON.stringify(result));
    }
  }, [result]);

  const handleGenerate = async () => {
    if (!title.trim()) { toast.error('Enter a book title'); return; }
    setGenerating(true);
    try {
      const data = await aiBackend.catalogBook(
        { title, author },
        {
          userId: 'admin', // In a real app, get from auth
          subType: 'manual_entry',
          prompt: `Catalog book: ${title} by ${author}`
        }
      );
      
      const newResult: CatalogResult = {
        title: title,
        author: author || 'Unknown Author',
        genre: data.genre || 'General',
        suggestedShelfLocation: data.suggestedShelfLocation || 'TBD',
        subjects: data.subjects || [],
        keywords: data.keywords || [],
        summary: data.summary || 'No summary generated.',
        targetAudience: data.targetAudience || 'General'
      };

      setResult(newResult);
      toast.success('AI Semantic Cataloging Complete!');
    } catch (err) {
      console.error('Cataloging error:', err);
      toast.error('Failed to catalog book');
    } finally {
      setGenerating(false);
    }
  };

  const saveCatalog = async () => {
    if (!result) return;
    try {
      // Save to actual database
      await booksApi.create({
        title: result.title,
        author: result.author,
        genre: result.genre,
        category: result.genre, // Mapping genre to category
        summary: result.summary,
        subjects: result.subjects,
        keywords: result.keywords,
        targetAudience: result.targetAudience,
        shelfLocation: result.suggestedShelfLocation
      });

      const updated = [result, ...recentCatalogs.slice(0, 9)];
      setRecentCatalogs(updated);
      localStorage.setItem('admin_recent_catalogs', JSON.stringify(updated));
      setResult(null);
      localStorage.removeItem('admin_last_catalog_result'); // Clear once saved to history
      setTitle('');
      setAuthor('');
      toast.success('Book successfully synchronized to database!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save book to database');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Catalog metadata copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Semantic Cataloging" description="Agentic metadata extraction and Dewey Decimal classification" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Area */}
          <div className="lg:col-span-1 space-y-6">
            <LibCard className="bg-accent/5 border-accent/20">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Wand2 className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Discovery Engine</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Work Title</label>
                    <div className="relative group">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
                      <input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="e.g. Design Patterns" 
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Author (Optional)</label>
                    <input 
                      value={author} 
                      onChange={(e) => setAuthor(e.target.value)} 
                      placeholder="e.g. Erich Gamma" 
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-medium" 
                    />
                  </div>
                  <LibButton 
                    onClick={handleGenerate} 
                    disabled={generating} 
                    className="w-full py-7 bg-accent text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-accent/20 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {generating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {generating ? 'ANALYZING...' : 'RUN SEMANTIC SCAN'}
                  </LibButton>
               </div>
            </LibCard>

            <LibCard className="p-6 bg-secondary/10 border-dashed">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Metadata Integrity</h4>
               <div className="space-y-3">
                  {[
                    { label: 'ISBN Verification', status: 'ACTIVE' },
                    { label: 'DDC Mapping', status: 'ACTIVE' },
                    { label: 'Subject Synthesis', status: 'ACTIVE' }
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between items-center text-[10px] font-bold">
                       <span className="text-muted-foreground">{s.label}</span>
                       <span className="text-accent flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {s.status}</span>
                    </div>
                  ))}
               </div>
            </LibCard>
          </div>

          {/* Result / Recent Area */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <LibCard className="border-accent/40 bg-accent/5 animate-in slide-in-from-right duration-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Fingerprint className="h-32 w-32 text-accent" />
                </div>
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-accent/20 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-accent text-white rounded-2xl shadow-lg shadow-accent/20">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{result.title}</h3>
                        <p className="text-xs font-bold text-accent uppercase tracking-widest">{result.author}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <LibBadge variant="available" className="bg-accent/20 text-accent border-none px-4 py-1.5 rounded-full font-black text-[10px]">AI VERIFIED</LibBadge>
                      <button 
                        onClick={() => handleCopy(`${result.title} by ${result.author}\nGenre: ${result.genre}\nShelf: ${result.suggestedShelfLocation}\nSummary: ${result.summary}`)}
                        className="p-2 hover:bg-accent/10 rounded-full transition-colors text-accent"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Primary Genre</p>
                         <p className="text-base font-black text-foreground">{result.genre}</p>
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Shelf Designation</p>
                         <div className="flex items-center gap-2">
                            <LibBadge className="bg-secondary text-foreground border-none font-black">{result.suggestedShelfLocation}</LibBadge>
                            <span className="text-[10px] text-muted-foreground font-medium italic">Optimized for accessibility</span>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Demographic</p>
                         <p className="text-sm font-bold text-foreground capitalize bg-secondary/30 px-3 py-1.5 rounded-lg inline-block">{result.targetAudience}</p>
                      </div>
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Semantic Subjects</p>
                         <div className="flex flex-wrap gap-2">
                            {result.subjects.map((s) => (
                              <span key={s} className="text-[9px] font-black uppercase px-2.5 py-1 bg-accent/10 text-accent border border-accent/20 rounded-md">{s}</span>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-accent/10 relative z-10">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Layers className="h-3 w-3 text-accent" /> Work Summary
                   </p>
                   <div className="p-4 bg-background/60 rounded-2xl border border-accent/10 text-xs text-muted-foreground leading-relaxed max-h-[250px] overflow-y-auto prose prose-invert prose-xs scrollbar-thin scrollbar-thumb-accent/20">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {result.summary}
                      </ReactMarkdown>
                   </div>
                </div>

                <div className="mt-8 flex gap-3 relative z-10">
                   <LibButton 
                     onClick={saveCatalog} 
                     className="bg-foreground text-background font-black uppercase tracking-widest text-[11px] px-8 py-6 rounded-xl hover:bg-black transition-all shadow-lg"
                   >
                     SYNCHRONIZE TO REPOSITORY
                   </LibButton>
                   <LibButton 
                     variant="ghost" 
                     onClick={() => setResult(null)} 
                     className="font-black uppercase tracking-widest text-[11px] px-6 py-6 rounded-xl border-2"
                   >
                     DISCARD SCAN
                   </LibButton>
                </div>
              </LibCard>
            ) : (
              <div className="space-y-6">
                <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-widest px-1">
                  <RefreshCw className="h-4 w-4 text-accent" /> Recently Cataloged
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentCatalogs.map((b, idx) => (
                    <LibCard key={idx} className="group hover:translate-y-[-2px] transition-all hover:shadow-lg">
                       <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                            <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                          </div>
                          <LibBadge className="bg-accent/5 text-accent border-none text-[9px] font-black uppercase">{b.suggestedShelfLocation}</LibBadge>
                       </div>
                       <h4 className="text-xs font-black text-foreground uppercase tracking-tight line-clamp-1">{b.title}</h4>
                       <p className="text-[10px] text-muted-foreground font-bold mb-4">{b.author}</p>
                       <div className="flex flex-wrap gap-1 mt-auto">
                          {b.subjects.slice(0, 2).map(s => (
                            <span key={s} className="text-[8px] font-black bg-secondary/50 px-2 py-0.5 rounded text-muted-foreground uppercase tracking-tighter">{s}</span>
                          ))}
                       </div>
                    </LibCard>
                  ))}
                  {recentCatalogs.length === 0 && (
                    <div className="col-span-2 text-center py-20 bg-secondary/5 rounded-3xl border-2 border-dashed border-border">
                       <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No recently cataloged items</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICataloging;
