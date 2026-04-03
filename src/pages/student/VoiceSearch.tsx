import React, { useState } from 'react';
import { Mic, MicOff, Search, BookOpen, Sparkles } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';
import { processVoiceQuery, VoiceQueryResult } from '@/services/aiBackend';

const sampleResults: any[] = [];

const recentSearches: string[] = [];

const VoiceSearch: React.FC = () => {
  const [listening, setListening] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<VoiceQueryResult | null>(null);

  const toggleListening = () => {
    if (listening) {
      setListening(false);
    } else {
      setListening(true);
      toast('🎤 Listening... speak now');
      // Simulate voice recognition
      setTimeout(() => {
        setListening(false);
        const recognizedText = 'Find me a book about artificial intelligence';
        setQuery(recognizedText);
        toast.success(`Voice recognized: "${recognizedText}"`);
        // Auto-process the voice query
        processVoiceCommand(recognizedText);
      }, 3000);
    }
  };

  const processVoiceCommand = async (text: string) => {
    setProcessing(true);
    try {
      const result = await processVoiceQuery(text);
      setAiResult(result);
      toast.success(`AI understood: ${result.intent} intent`);
      // Mock search results based on AI interpretation
      setResults([
        { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', category: 'AI', available: true },
        { title: 'Deep Learning', author: 'Ian Goodfellow', category: 'AI', available: false },
      ]);
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Failed to process voice query');
    } finally {
      setProcessing(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    await processVoiceCommand(query);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Voice Search" description="Search books using your voice or text" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Search Area */}
        <LibCard className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Search or use voice..." className="w-full pl-9 pr-3 py-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <LibButton onClick={toggleListening} variant={listening ? 'danger' : 'primary'} className="px-4">
              {listening ? <><MicOff className="h-5 w-5" /> <span className="ml-2 hidden sm:inline">Stop</span></> : <><Mic className="h-5 w-5" /> <span className="ml-2 hidden sm:inline">Speak</span></>}
            </LibButton>
          </div>
          {listening && (
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse">
                <Mic className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-sm text-foreground mt-3">Listening...</p>
              <p className="text-xs text-muted-foreground">Say something like "Find algorithms textbook"</p>
            </div>
          )}
          
          {processing && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-spin text-accent" />
                <span>AI is processing your query...</span>
              </div>
            </div>
          )}
          
          {aiResult && (
            <div className="bg-accent/5 rounded-md p-3 border border-accent/10">
              <p className="text-xs font-semibold text-foreground mb-1">AI Interpretation:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-background rounded">Intent: {aiResult.intent}</span>
                <span className="px-2 py-1 bg-background rounded">Terms: {aiResult.searchTerms}</span>
                {aiResult.genre && <span className="px-2 py-1 bg-background rounded">Genre: {aiResult.genre}</span>}
                <span className="px-2 py-1 bg-background rounded">Confidence: {Math.round(aiResult.confidence * 100)}%</span>
              </div>
            </div>
          )}
        </LibCard>

        {/* Recent Searches */}
        {results.length === 0 && !query && (
          <LibCard className="text-center py-10 bg-secondary/5 border-2 border-dashed border-muted/20">
            <div className="h-12 w-12 bg-secondary/80 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your search history is empty</p>
            <p className="text-[10px] text-muted-foreground mt-2">Try searching for "Machine Learning" or use the mic button!</p>
          </LibCard>
        )}

        {/* Results */}
        {results.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">{results.length} Matches Found</h3>
            {results.map((r) => (
              <LibCard key={r.title} className="flex items-center justify-between group hover:border-accent/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-secondary rounded-lg flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{r.title}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{r.author} · {r.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <LibBadge variant={r.available ? 'available' : 'issued'}>{r.available ? 'Available' : 'Issued'}</LibBadge>
                  {r.available && (
                    <LibButton size="sm" className="h-8 text-[10px]" onClick={() => toast.success('Borrow request sent!')}>
                      Issue Now
                    </LibButton>
                  )}
                </div>
              </LibCard>
            ))}
          </div>
        ) : query && !listening && (
          <LibCard className="py-20 text-center border-accent/10 bg-gradient-to-t from-accent/5 to-transparent">
            <div className="relative h-16 w-16 mx-auto mb-6">
               <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
               <div className="relative h-16 w-16 bg-secondary rounded-full flex items-center justify-center border border-accent/20">
                  <Search className="h-8 w-8 text-accent/60" />
               </div>
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1 uppercase tracking-widest">No books found for "{query}"</h4>
            <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">Try rephrasing your search or browse our catalog manually.</p>
            <LibButton variant="secondary" size="sm" className="mt-6" onClick={() => (window.location.href = '/student/books')}>
               Browse Full Library
            </LibButton>
          </LibCard>
        )}
      </div>
    </div>
  );
};

export default VoiceSearch;
