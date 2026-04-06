import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Mic, MicOff, History, RotateCcw, X, Star, Heart, MessageSquare, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import LibButton from '@/components/ui/LibButton';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/layout/PageHeader';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useIssueBook } from '@/hooks/useBorrow';
import { addDays } from 'date-fns';
import { useBooks } from '@/hooks/useBooks';
import { useCategories } from '@/hooks/useCategories';
import { processVoiceQuery } from '@/services/aiBackend';
import { wishlistApi } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BrowseBooks: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [catSearch, setCatSearch] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('voice_search_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedBook, setSelectedBook] = useState<any | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist', user?.uid],
    queryFn: () => import('@/services/api').then(m => m.wishlistApi.get(user?.uid || '')),
    enabled: !!user?.uid,
  });

  const wishlist = wishlistData?.data || [];

  const toggleWishlistMutation = useMutation({
    mutationFn: (bookId: string) => import('@/services/api').then(m => m.wishlistApi.toggle(user?.uid || '', bookId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.uid] });
      toast.success('Wishlist updated!');
    },
  });

  const isBookWishlisted = (bookId: string) => wishlist.some((w: any) => w.bookId === bookId);

  const handleToggleWishlist = (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please login to use wishlist');
      return;
    }
    toggleWishlistMutation.mutate(bookId);
  };

  const { data: allBooksData, isLoading } = useBooks({
    search: search.length >= 2 ? search : undefined,
    category: selectedCategories.length === 1 ? selectedCategories[0] : undefined
  });

  const { data: catList = [] } = useCategories();

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      toast.error('Voice search is not supported in this browser');
      return;
    }

    const Recognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.loading('Listening...', { id: 'voice-search' });
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      toast.success(`Heard: "${transcript}"`, { id: 'voice-search' });
      
      try {
        const result = await processVoiceQuery(transcript, {
          userId: user?.uid,
          userEmail: user?.email,
          subType: 'voice_browse'
        });
        
        // Update history
        const newHistory = [transcript, ...voiceHistory.slice(0, 4)];
        setVoiceHistory(newHistory);
        localStorage.setItem('voice_search_history', JSON.stringify(newHistory));

        if (result.intent === 'search' || result.intent === 'recommendation' || result.intent === 'info') {
          if (result.bookTitle) setSearch(result.bookTitle);
          else if (result.searchTerms) setSearch(result.searchTerms);
          
          if (result.genre) {
            const matchedCat = catList.find(c => c.toLowerCase().includes(result.genre?.toLowerCase() || ''));
            if (matchedCat) setSelectedCategories([matchedCat]);
          }
          
          toast.success('Search updated based on your request!');
        }
      } catch (err) {
        console.error('Voice processing error:', err);
        setSearch(transcript); // Fallback to raw transcript
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      toast.error('Voice recognition error. Please try again.', { id: 'voice-search' });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };
  
  const issueBook = useIssueBook();

  const allBooks = allBooksData || [];

  // Filter categories based on category search
  const filteredCats = useMemo(() => {
    return catList.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()));
  }, [catList, catSearch]);

  const handleBorrow = (bookId: string) => {
    if (!user?.isProfileComplete) {
      toast.error('Please complete your profile to borrow books');
      return;
    }
    
    issueBook.mutate({
      studentId: user.uid,
      bookId,
      dueDate: addDays(new Date(), 14).toISOString(), // Default 14 days
    });
  };

  const filtered = useMemo(() => {
    return allBooks.filter((b: any) => {
      const matchCategory = selectedCategories.length === 0 || selectedCategories.some(c => (b.category || '').includes(c));
      const matchAvail = !showAvailableOnly || b.available;
      return matchCategory && matchAvail;
    });
  }, [allBooks, selectedCategories, showAvailableOnly]);

  const perPage = 12;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setPage(1);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Browse Books" description="Discover and borrow books from our collection" />

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-4 flex flex-col overflow-hidden pb-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search books..."
              className="w-full pl-9 pr-10 py-2 rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            <button
              onClick={startVoiceSearch}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'hover:bg-accent/10 text-muted-foreground hover:text-accent'
              }`}
              title="Voice Search"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          </div>

          {/* Voice Search History */}
          {voiceHistory.length > 0 && (
            <LibCard className="p-3 bg-accent/5 border-accent/10 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-3.5 w-3.5 text-accent" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent/80">Recent Voice</span>
              </div>
              <div className="space-y-1.5">
                {voiceHistory.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearch(h);
                      setPage(1);
                      toast.success(`Re-applying: ${h}`);
                    }}
                    className="w-full text-left text-xs text-muted-foreground hover:text-accent hover:bg-accent/5 p-1.5 rounded-md transition-colors truncate flex items-center gap-2 group"
                  >
                    <RotateCcw className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="truncate">{h}</span>
                  </button>
                ))}
              </div>
            </LibCard>
          )}

          <LibCard className="flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-3 shrink-0 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-accent" />
                  Categories
                </h4>
                {selectedCategories.length > 0 && (
                  <button 
                    onClick={() => setSelectedCategories([])}
                    className="text-[10px] text-accent hover:underline font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background/50 text-[12px] focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-1 overflow-y-auto p-4 pr-2 custom-scrollbar max-h-[300px] lg:max-h-[450px]">
              {filteredCats.length > 0 ? (
                filteredCats.map((cat) => (
                  <label 
                    key={cat} 
                    className={`flex items-center gap-2 p-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                      selectedCategories.includes(cat) ? 'bg-accent/10 text-accent font-medium' : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="rounded border-input text-accent focus:ring-accent w-3 h-3"
                    />
                    <span className="line-clamp-1 flex-1">{cat}</span>
                  </label>
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic text-center py-4">No categories found</p>
              )}
            </div>
          </LibCard>

          <LibCard className="shrink-0">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="rounded border-input text-accent focus:ring-accent"
              />
              Available only
            </label>
          </LibCard>
        </div>

        {/* Books Grid - scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No books found" message="Try adjusting your filters or search terms." />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map((book: any) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onBorrow={handleBorrow} 
                    isPending={issueBook.isPending} 
                    isWishlisted={isBookWishlisted(book.id)}
                    onToggleWishlist={(e) => handleToggleWishlist(e, book.id)}
                    onClick={() => setSelectedBook(book)}
                  />
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Book Details Modal */}
      {selectedBook && (
        <BookDetailsModal 
          book={selectedBook} 
          allBooks={allBooks}
          onClose={() => setSelectedBook(null)} 
          onBorrow={handleBorrow}
          isPending={issueBook.isPending}
          onSelectBook={(b) => setSelectedBook(b)}
          isWishlisted={isBookWishlisted(selectedBook.id)}
          onToggleWishlist={(e) => handleToggleWishlist(e, selectedBook.id)}
        />
      )}
    </div>
  );
};

// Internal component for better state management of individual books
const BookCard: React.FC<{ 
  book: any, 
  onBorrow: (id: string) => void,
  isPending: boolean,
  onClick?: () => void,
  isWishlisted?: boolean,
  onToggleWishlist?: (e: React.MouseEvent) => void
}> = ({ book, onBorrow, isPending, onClick, isWishlisted, onToggleWishlist }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <LibCard 
      onClick={onClick}
      className="group flex flex-col h-full border-border/40 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-accent/5 mb-4 border border-border/50">
        {!imageError && book.cover ? (
          <img 
            src={book.cover} 
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/30 bg-gradient-to-br from-accent/5 to-transparent">
            <BookOpen className="h-10 w-10" />
            <span className="text-[10px] font-medium uppercase tracking-widest">No Cover</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <LibBadge className="bg-white/90 text-black border-none backdrop-blur-sm">
            {book.category}
          </LibBadge>
        </div>
        <button
          onClick={onToggleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
            isWishlisted 
              ? 'bg-accent text-white scale-110 shadow-lg shadow-accent/20' 
              : 'bg-black/20 text-white/70 hover:bg-black/40 hover:text-white hover:scale-110'
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex-1 space-y-1 mb-4">
        <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
          {book.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{book.author}</p>
      </div>

      <div className="space-y-3 mt-auto">
        <div className="flex items-center justify-between">
          <LibBadge variant={book.available ? 'available' : 'issued'} className="px-2 py-0.5 text-[10px]">
             {book.available ? 'Ready to Borrow' : 'Currently Issued'}
          </LibBadge>
        </div>

        {book.available ? (
          <LibButton 
            size="sm" 
            className="w-full font-bold shadow-lg shadow-accent/10" 
            onClick={(e) => { e.stopPropagation(); onBorrow(book.id); }}
            loading={isPending}
          >
            Borrow Now
          </LibButton>
        ) : (
          <LibButton 
            size="sm" 
            variant="ghost" 
            className="w-full opacity-50 cursor-not-allowed" 
            disabled
            onClick={(e) => e.stopPropagation()}
          >
            Not Available
          </LibButton>
        )}
      </div>
    </LibCard>
  );
};

// --- Book Details Modal ---
const BookDetailsModal: React.FC<{
  book: any,
  allBooks: any[],
  onClose: () => void,
  onBorrow: (id: string) => void,
  isPending: boolean,
  onSelectBook: (book: any) => void,
  isWishlisted: boolean,
  onToggleWishlist: (e: React.MouseEvent) => void
}> = ({ book, allBooks, onClose, onBorrow, isPending, onSelectBook, isWishlisted, onToggleWishlist }) => {
  const [imgErr, setImgErr] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch reviews for this book
  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', book.id],
    queryFn: () => import('@/services/api').then(m => m.reviewsApi.getByBook(book.id)),
  });

  const addReviewMutation = useMutation({
    mutationFn: (data: any) => import('@/services/api').then(m => m.reviewsApi.add(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', book.id] });
      toast.success('Review added!');
      setNewReview('');
      setRating(0);
    },
  });

  const handleAddReview = () => {
    if (!user) return toast.error('Please login to review');
    if (rating === 0) return toast.error('Please select a rating');
    if (!newReview.trim()) return toast.error('Please enter a comment');
    
    addReviewMutation.mutate({
      bookId: book.id,
      userId: user.uid,
      rating,
      comment: newReview
    });
  };

  const filteredRecs = allBooks
    .filter((r: any) => r.category === book.category && r.id !== book.id)
    .slice(0, 5);

  const reviews = reviewsData?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-card border border-border shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose} 
          className="absolute right-6 top-6 z-20 p-2 rounded-full bg-background/50 hover:bg-background shadow-sm transition-all"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Fixed Image & Quick Actions */}
          <div className="md:w-1/3 bg-background/40 p-8 flex flex-col gap-6 overflow-y-auto no-scrollbar border-r border-border/50">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-accent/5 border border-border shadow-xl group">
              {!imgErr && book.cover ? (
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" onError={() => setImgErr(true)} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground/30">
                  <BookOpen className="h-16 w-16" />
                  <span className="text-xs font-bold uppercase tracking-widest">No Cover Available</span>
                </div>
              )}
              <button
                onClick={onToggleWishlist}
                className={`absolute top-4 right-4 p-3 rounded-xl backdrop-blur-md transition-all shadow-lg ${
                  isWishlisted ? 'bg-accent text-white' : 'bg-black/20 text-white hover:bg-black/40'
                }`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-4">
              <LibButton 
                onClick={() => onBorrow(book.id)} 
                loading={isPending}
                disabled={!book.available}
                className="w-full py-7 text-lg font-bold shadow-xl shadow-accent/20"
              >
                {book.available ? 'Borrow Now' : 'Out of Stock'}
              </LibButton>
              <Link to="/student/ai-summary" state={{ bookId: book.id, title: book.title }} className="block">
                <LibButton variant="secondary" size="lg" className="w-full py-6 group">
                  <Star className="h-4 w-4 mr-2 text-accent group-hover:animate-spin" />
                  AI Summary & Insights
                </LibButton>
              </Link>
            </div>

            {/* Quick Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-card border border-border rounded-xl text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Status</p>
                <p className={`text-xs font-bold ${book.available ? 'text-green-500' : 'text-blue-500'}`}>
                  {book.available ? 'AVAILABLE' : 'ISSUED'}
                </p>
              </div>
              <div className="p-3 bg-card border border-border rounded-xl text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Reviews</p>
                <p className="text-xs font-bold text-foreground">{reviews.length} TOTAL</p>
              </div>
            </div>
          </div>

          {/* Right: Content Tabs */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white/5">
            <div className="px-8 pt-8 shrink-0">
              <div className="flex items-center gap-3 text-secondary-foreground/60 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded bg-accent/10 text-accent">
                  {book.category}
                </span>
                <span className="text-xs opacity-40">/</span>
                <span className="text-xs font-medium">#{book.id.slice(0, 8)}</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight mb-4">
                {book.title}
              </h2>
              <p className="text-xl text-muted-foreground font-medium mb-8">
                by <span className="text-foreground/80">{book.author}</span>
              </p>

              {/* Tabs Nav */}
              <div className="flex gap-8 border-b border-border/50">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                    activeTab === 'info' ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  About
                  {activeTab === 'info' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all relative ${
                    activeTab === 'reviews' ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Reviews ({reviews.length})
                  {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-8">
                {activeTab === 'info' ? (
                  <div className="space-y-12">
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Description
                      </h4>
                      <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl font-medium italic">
                        "{book.description || `Explore this masterpiece in the category of ${book.category} by ${book.author}. A valuable addition to our library collection.`}"
                      </p>
                    </div>

                    {/* Recommendations inside About */}
                    {filteredRecs.length > 0 && (
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" /> Community Favorites in {book.category}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {filteredRecs.map((rec: any) => (
                            <button 
                              key={rec.id}
                              onClick={() => {
                                onSelectBook(rec);
                                setImgErr(false);
                                setActiveTab('info');
                              }}
                              className="group text-left space-y-3 transition-transform hover:-translate-y-2"
                            >
                              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-accent/5 border border-border shadow-sm">
                                {rec.cover ? (
                                  <img src={rec.cover} alt={rec.title} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><BookOpen /></div>
                                )}
                              </div>
                              <h5 className="font-bold text-xs line-clamp-1 group-hover:text-accent transition-colors">{rec.title}</h5>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8 max-w-3xl">
                    {/* Add Review Box */}
                    <LibCard className="bg-accent/5 border-accent/20 p-6 space-y-4">
                      <h4 className="text-sm font-bold text-foreground">Share your thoughts</h4>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setRating(s)} className="p-1 hover:scale-110 transition-transform">
                            <Star className={`h-6 w-6 ${s <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/20'}`} />
                          </button>
                        ))}
                      </div>
                      <textarea 
                        value={newReview}
                        onChange={(e) => setNewReview(e.target.value)}
                        placeholder="What did you think of this book?"
                        className="w-full bg-background border border-border rounded-xl p-4 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none min-h-[100px] resize-none"
                      />
                      <LibButton 
                        onClick={handleAddReview} 
                        loading={addReviewMutation.isPending}
                        className="w-full"
                      >
                        Post Community Review
                      </LibButton>
                    </LibCard>

                    {/* Review List */}
                    <div className="space-y-4">
                      {reviewsLoading ? (
                        <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent/20" /></div>
                      ) : reviews.length > 0 ? (
                        reviews.map((r: any) => (
                          <LibCard key={r.id} className="p-6 transition-all hover:bg-white/5 border-white/5">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold uppercase">
                                  {r.userName?.charAt(0) || 'U'}
                                </div>
                                <span className="font-bold text-sm">{r.userName || 'Anonymous Reader'}</span>
                              </div>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/20'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-accent/20 pl-4 py-1">"{r.comment}"</p>
                            <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-widest font-black opacity-50">
                              {r.createdAt?.toDate ? formatDate(r.createdAt.toDate().toISOString()) : 'Recent'}
                            </p>
                          </LibCard>
                        ))
                      ) : (
                        <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                          <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                          <h4 className="font-bold text-foreground">No reviews yet</h4>
                          <p className="text-sm text-muted-foreground">Be the first to share your thoughts with other students!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <ScrollBar />
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseBooks;
