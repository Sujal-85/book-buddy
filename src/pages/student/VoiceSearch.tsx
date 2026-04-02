import React, { useState } from 'react';
import { Mic, MicOff, Search, BookOpen } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const sampleResults = [
  { title: 'Introduction to Algorithms', author: 'Thomas Cormen', category: 'Computer Science', available: true },
  { title: 'Algorithm Design Manual', author: 'Steven Skiena', category: 'Computer Science', available: true },
  { title: 'Algorithms Unlocked', author: 'Thomas Cormen', category: 'Computer Science', available: false },
];

const recentSearches = ['machine learning books', 'data structures and algorithms', 'web development react', 'database management systems', 'artificial intelligence textbook'];

const VoiceSearch: React.FC = () => {
  const [listening, setListening] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof sampleResults>([]);

  const toggleListening = () => {
    if (listening) {
      setListening(false);
      setQuery('algorithms textbook');
      setResults(sampleResults);
      toast.success('Voice recognized!');
    } else {
      setListening(true);
      toast('🎤 Listening... speak now');
      setTimeout(() => {
        setListening(false);
        setQuery('algorithms textbook');
        setResults(sampleResults);
        toast.success('Voice recognized!');
      }, 3000);
    }
  };

  const handleSearch = () => {
    if (query.trim()) { setResults(sampleResults); toast.success(`Found ${sampleResults.length} results`); }
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
        </LibCard>

        {/* Recent Searches */}
        {results.length === 0 && (
          <LibCard>
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((s) => (
                <button key={s} onClick={() => { setQuery(s); setResults(sampleResults); }} className="text-xs px-3 py-1.5 rounded-full bg-secondary text-foreground hover:bg-secondary/80">{s}</button>
              ))}
            </div>
          </LibCard>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{results.length} Results</h3>
            {results.map((r) => (
              <LibCard key={r.title} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div><p className="text-sm font-medium text-foreground">{r.title}</p><p className="text-xs text-muted-foreground">{r.author}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <LibBadge variant={r.available ? 'available' : 'issued'}>{r.available ? 'Available' : 'Issued'}</LibBadge>
                  {r.available && <LibButton size="sm" onClick={() => toast.success('Borrow request sent!')}>Borrow</LibButton>}
                </div>
              </LibCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSearch;
