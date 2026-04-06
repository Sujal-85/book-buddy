import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, booksApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import { MessageSquare, Star, Loader2, BookOpen, ThumbsUp, Brain, Sparkles, Filter, X, TrendingUp } from 'lucide-react';
import { analyzeReviews, ReviewAnalysis } from '@/services/aiBackend';

const BookReviews: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [filterBookId, setFilterBookId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<ReviewAnalysis | null>(null);

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: () => reviewsApi.getAll(),
  });

  const { data: booksData } = useQuery({
    queryKey: ['all-books'],
    queryFn: () => booksApi.getAll(),
  });

  const addReviewMutation = useMutation({
    mutationFn: (data: any) => reviewsApi.add(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-reviews'] });
      toast.success('Review submitted!');
      setNewReview('');
      setRating(0);
      setSelectedBookId('');
    },
    onError: () => toast.error('Failed to submit review'),
  });

  const handleAddReview = () => {
    if (!user) return toast.error('Please login');
    if (!selectedBookId) return toast.error('Please select a book');
    if (rating === 0) return toast.error('Please select a rating');
    if (!newReview.trim()) return toast.error('Please write a comment');

    addReviewMutation.mutate({
      bookId: selectedBookId,
      userId: user.uid,
      rating,
      comment: newReview,
    });
  };

  const reviews = reviewsData?.data || [];
  const books = Array.isArray(booksData) ? booksData : (booksData as any)?.data || [];

  const filteredReviews = useMemo(() => {
    if (!filterBookId) return reviews;
    return reviews.filter((r: any) => r.bookId === filterBookId);
  }, [reviews, filterBookId]);

  const selectedBookForFilter = useMemo(() => {
    return books.find((b: any) => b.id === filterBookId);
  }, [books, filterBookId]);

  const handleAIAnalyze = async () => {
    if (!filterBookId || filteredReviews.length === 0) {
      toast.error('Please select a book with reviews to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const reviewTexts = filteredReviews.map((r: any) => r.comment);
      const result = await analyzeReviews(reviewTexts, {
        userId: user?.uid,
        userEmail: user?.email,
        subType: 'review_sentiment_analysis',
        prompt: `Analyze sentiment for book: ${selectedBookForFilter?.title}`
      });
      setAiAnalysis(result);
      toast.success('AI Sentiment Analysis Complete!');
    } catch (err) {
      console.error('AI analysis error:', err);
      toast.error('Failed to generate AI insights');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAiAnalysis(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Community Echoes" description="Discover what your peers are reading and share your own literary journeys" />
      <div className="flex-1 overflow-y-auto space-y-10 pr-1 pb-10">
        {/* Write Review */}
        <LibCard className="p-8 border-accent/20 bg-accent/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
            <MessageSquare className="h-40 w-40 text-accent" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" /> 
              Contribute to the Gallery
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Choose a Masterpiece</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <select 
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border/50 bg-background text-sm focus:ring-4 focus:ring-accent/10 outline-none appearance-none font-bold transition-all hover:border-accent/30 cursor-pointer"
                  >
                    <option value="">Select a book...</option>
                    {books.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Star Assessment</label>
                <div className="flex gap-2 p-1.5 bg-background border border-border/50 rounded-2xl justify-center items-center h-[50px] shadow-inner">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} className="p-1 hover:scale-125 transition-transform duration-200">
                      <Star className={`h-6 w-6 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/20'}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Your Narrative</label>
              <textarea 
                value={newReview} 
                onChange={(e) => setNewReview(e.target.value)} 
                placeholder="Paint a picture with your words... what made this book special?" 
                rows={4} 
                className="w-full px-5 py-4 rounded-[2rem] border border-border/50 bg-background text-[15px] focus:ring-4 focus:ring-accent/10 outline-none resize-none font-medium italic transition-all placeholder:text-muted-foreground/30 shadow-inner" 
              />
            </div>

            <LibButton 
               onClick={handleAddReview} 
               loading={addReviewMutation.isPending}
               className="w-full py-8 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/20 text-lg hover:scale-[1.01] active:scale-95 transition-all"
            >
              Publish to Activity Feed
            </LibButton>
          </div>
        </LibCard>

        {/* AI Insight Explorer */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" /> 
              Review Intelligence
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <select 
                  value={filterBookId}
                  onChange={(e) => { setFilterBookId(e.target.value); resetAnalysis(); }}
                  className="pl-9 pr-8 py-2 rounded-xl border border-border/50 bg-background text-[11px] font-black uppercase tracking-tighter focus:ring-2 focus:ring-accent/20 outline-none appearance-none cursor-pointer transition-all hover:bg-secondary/50"
                >
                  <option value="">All Community Reviews</option>
                  {books.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>
              {filterBookId && filteredReviews.length > 0 && (
                <LibButton 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 text-[10px] gap-2 border-accent/20 text-accent hover:bg-accent/5"
                  onClick={handleAIAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Generate AI Summary
                </LibButton>
              )}
            </div>
          </div>

          {aiAnalysis && (
            <LibCard className="p-8 border-accent/30 bg-accent/5 animate-in slide-in-from-top-4 duration-500 rounded-[2.5rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6">
                 <div className={`h-16 w-16 rounded-full flex items-center justify-center border-4 ${
                   aiAnalysis.overallSentiment === 'positive' ? 'border-green-500/30 text-green-500' : 
                   aiAnalysis.overallSentiment === 'negative' ? 'border-red-500/30 text-red-500' : 
                   'border-blue-500/30 text-blue-500'
                 } font-black text-xl`}>
                   {aiAnalysis.sentimentScore}%
                 </div>
               </div>

               <div className="space-y-8 relative z-10">
                 <div>
                   <LibBadge variant="default" className="text-[10px] bg-accent text-white border-none uppercase tracking-widest mb-3 px-3">
                     AI SYNTHESIS: {selectedBookForFilter?.title}
                   </LibBadge>
                   <h4 className="text-2xl font-black text-foreground tracking-tight max-w-2xl leading-tight italic">
                     &ldquo;{aiAnalysis.briefSummary}&rdquo;
                   </h4>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="space-y-3">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Common Praises</p>
                     <div className="flex flex-wrap gap-2">
                       {aiAnalysis.commonPraises?.map((p, i) => (
                         <LibBadge key={i} variant="available" className="text-[9px] uppercase font-bold py-1 px-2">{p}</LibBadge>
                       ))}
                     </div>
                   </div>
                   <div className="space-y-3">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Frequent Themes</p>
                     <div className="flex flex-wrap gap-2">
                       {aiAnalysis.keyThemes?.map((t, i) => (
                         <LibBadge key={i} variant="default" className="text-[9px] uppercase font-bold py-1 px-2 border-accent/20 text-accent bg-accent/5">{t}</LibBadge>
                       ))}
                     </div>
                   </div>
                   <div className="space-y-3">
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Reader Critiques</p>
                     <div className="flex flex-wrap gap-2">
                       {aiAnalysis.commonComplaints?.map((c, i) => (
                         <LibBadge key={i} variant="default" className="text-[9px] uppercase font-bold py-1 px-2 opacity-70">{c}</LibBadge>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
            </LibCard>
          )}

          {/* Activity Feed */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                {filterBookId ? 'Book-Specific Feedback' : 'Global Reader Feed'}
                <LibBadge variant="default" className="text-[10px] font-black h-5 min-w-[20px] px-1 bg-secondary text-secondary-foreground">
                  {filteredReviews.length}
                </LibBadge>
              </h3>
              {filterBookId && (
                <button 
                  onClick={() => setFilterBookId('')}
                  className="text-[10px] font-black text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors"
                >
                  <X className="h-3 w-3" /> Clear Filter
                </button>
              )}
            </div>
            
            {isLoading ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent/40" />
              </div>
            ) : filteredReviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredReviews.map((r: any) => (
                  <LibCard key={r.id} className="p-6 space-y-4 group bg-card border-border/40 hover:border-accent/30 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5 rounded-3xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:bg-accent group-hover:text-white transition-all duration-500 shadow-sm">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground line-clamp-1">{r.bookTitle}</p>
                          <p className="text-xs text-muted-foreground font-medium">by {r.bookAuthor}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 pt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/20'}`} />
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -left-2 top-0 text-3xl opacity-10 font-serif font-black text-accent">&ldquo;</div>
                      <p className="text-sm text-foreground leading-relaxed italic pl-3 pb-2 font-medium">
                        {r.comment}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                          {r.userName?.charAt(0)}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                          {r.userName} &middot; <span className="opacity-60">{r.createdAt?.seconds ? formatDistanceToNow(new Date(r.createdAt.seconds * 1000)) + ' ago' : 'Recently'}</span>
                        </p>
                      </div>
                      <button onClick={() => toast.success('Helpful vote recorded!')} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors active:scale-95 group/btn">
                        <ThumbsUp className="h-3 w-3 group-hover/btn:-translate-y-0.5 transition-transform" /> 
                        <span className="font-bold opacity-0 group-hover:opacity-100 transition-opacity">Helpful</span>
                      </button>
                    </div>
                  </LibCard>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border-2 border-dashed border-border rounded-2xl bg-secondary/5">
                <div className="h-16 w-16 bg-card rounded-full flex items-center justify-center shadow-inner">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-black text-foreground uppercase tracking-widest">No chatter yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">The community hasn't reviewed any books yet. Be the first to spark a conversation!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookReviews;
