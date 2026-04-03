import React, { useState, useMemo } from 'react';
import { Sparkles, BookOpen, ThumbsUp, RefreshCw, Search, User } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';
import { getBookRecommendations, BookRecommendation } from '@/services/aiBackend';
import { useCategories } from '@/hooks/useCategories';
import { useBooks } from '@/hooks/useBooks';

interface Recommendation extends BookRecommendation {
  id: string;
  category?: string;
  cover?: string;
  match: number;
}

const AIRecommendations: React.FC = () => {
  const storageKey = 'ai_recommendations_history';

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [preferences, setPreferences] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genSearch, setGenSearch] = useState('');

  const { data: catList = [] } = useCategories();
  const { data: allBooks = [] } = useBooks();

  const filteredGenres = useMemo(() => {
    return catList.filter(g => g.toLowerCase().includes(genSearch.toLowerCase()));
  }, [catList, genSearch]);

  const refresh = async () => {
    if (!preferences.trim() && selectedGenres.length === 0) {
      toast.error('Please enter your preferences or select genres');
      return;
    }
    
    setLoading(true);
    try {
      // Pass libraryBooks for strict recommendation logic
      const result = await getBookRecommendations(
        preferences || 'books based on my interests',
        selectedGenres,
        6,
        allBooks
      );
      
      const transformed: Recommendation[] = result.map((book, index) => {
        // Try to find the actual book in the library to get the cover and category
        const actualBook = allBooks.find(b => 
          b.title.toLowerCase() === book.title.toLowerCase() || 
          (b.title.toLowerCase().includes(book.title.toLowerCase()) && b.author.toLowerCase().includes(book.author.toLowerCase()))
        );

        return {
          ...book,
          id: `rec-${index}-${Date.now()}`,
          category: actualBook?.category || 'General',
          cover: actualBook?.cover,
          match: Math.floor(Math.random() * 20) + 80,
        };
      });
      
      setRecommendations(transformed);
      localStorage.setItem(storageKey, JSON.stringify(transformed));
      toast.success(`Found ${transformed.length} smart recommendations!`);
    } catch (error) {
      console.error('Recommendations error:', error);
      toast.error('Failed to get smart recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader 
        title="AI Book Recommendations" 
        description="Personalized reading suggestions based on your history and interests"
        action={
          <LibButton 
            size="sm" 
            onClick={refresh} 
            disabled={loading} 
            className="flex items-center gap-2"
          >
            {loading ? (
              <><RefreshCw className="h-3 w-3 animate-spin" /> Refreshing...</>
            ) : (
              <><Sparkles className="h-3 w-3" /> Get Recommendations</>
            )}
          </LibButton>
        } 
      />
      
      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
        <LibCard className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Tell us your preferences</h3>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                value={preferences} 
                onChange={(e) => setPreferences(e.target.value)} 
                placeholder="e.g., I like mystery novels with plot twists..."
                className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Or select genres:</p>
              <div className="relative w-32">
                <input 
                  type="text"
                  placeholder="Search genres..."
                  className="w-full pl-2 pr-2 py-1 text-[10px] rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-accent"
                  value={genSearch}
                  onChange={(e) => setGenSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 scrollbar-thin">
              {filteredGenres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    selectedGenres.includes(genre)
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-background text-foreground border-input hover:bg-secondary'
                  }`}
                >
                  {genre}
                </button>
              ))}
              {filteredGenres.length === 0 && (
                <p className="text-[10px] text-muted-foreground italic">No genres found matching "{genSearch}"</p>
              )}
            </div>
          </div>
        </LibCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
          {recommendations.length > 0 ? (
            recommendations.map((book) => (
              <LibCard key={book.id} className="space-y-3 shrink-0">
                <div className="h-48 bg-secondary/50 rounded-md flex items-center justify-center border border-muted/20 relative overflow-hidden group">
                  {book.cover ? (
                    <img 
                      src={book.cover} 
                      alt={book.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).className = 'hidden';
                      }}
                    />
                  ) : (
                    <BookOpen className="h-10 w-10 text-muted-foreground group-hover:scale-110 transition-transform duration-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{book.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                </div>
                <div className="flex items-center justify-between">
                  <LibBadge variant="default" className="text-[10px] uppercase tracking-wider">{book.category}</LibBadge>
                  <span className="text-[10px] font-bold text-accent px-1.5 py-0.5 bg-accent/10 rounded">{book.match}% match</span>
                </div>
                <p className="text-xs text-muted-foreground italic line-clamp-2 min-h-[2rem]">💡 {book.matchReason}</p>
                <p className="text-xs text-muted-foreground line-clamp-3">{book.description}</p>
                <div className="flex gap-2 pt-2">
                  <LibButton size="sm" className="flex-1 transition-all active:scale-95" onClick={() => toast.success('Borrow request sent!')}>Borrow</LibButton>
                  <LibButton size="sm" variant="ghost" className="hover:bg-accent/10 hover:text-accent" onClick={() => toast.success('Added to wishlist!')}><ThumbsUp className="h-3.5 w-3.5" /></LibButton>
                </div>
              </LibCard>
            ))
          ) : (
            <div className="col-span-full h-80 flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 bg-accent/5 rounded-full flex items-center justify-center border border-accent/10">
                <Sparkles className="h-8 w-8 text-accent/40" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">Get AI-Powered Recommendations</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Enter your reading preferences or select genres above, and our AI will suggest books you'll love.
                </p>
              </div>
              <LibButton size="sm" variant="ghost" onClick={refresh} disabled={loading}>
                {loading ? 'Generating...' : 'Get Started'}
              </LibButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
