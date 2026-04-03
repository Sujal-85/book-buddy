import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, booksApi } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import { MessageSquare, Star, Loader2, BookOpen, ThumbsUp } from 'lucide-react';

const BookReviews: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedBookId, setSelectedBookId] = useState('');

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Book Reviews & Ratings" description="Read and write reviews to help fellow students choose books" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-10">
        {/* Write Review */}
        <LibCard className="space-y-4 bg-accent/5 border-accent/10">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" /> 
            Write a Review
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase px-1">Choose a Book</label>
              <select 
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-background text-sm focus:ring-2 focus:ring-accent/20 outline-none appearance-none font-medium"
              >
                <option value="">Select a book...</option>
                {books.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase px-1">Your Rating</label>
              <div className="flex gap-2 p-1.5 bg-background border border-border/50 rounded-xl justify-center items-center h-[42px]">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="p-0.5 hover:scale-125 transition-transform">
                    <Star className={`h-5 w-5 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase px-1">Your Thoughts</label>
            <textarea 
              value={newReview} 
              onChange={(e) => setNewReview(e.target.value)} 
              placeholder="What did you think about the characters, plot, or writing style?" 
              rows={4} 
              className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background text-sm focus:ring-2 focus:ring-accent/20 outline-none resize-none font-medium italic" 
            />
          </div>

          <LibButton 
             onClick={handleAddReview} 
             loading={addReviewMutation.isPending}
             className="w-full py-6 font-bold shadow-xl shadow-accent/10"
          >
            Post Review to Gallery
          </LibButton>
        </LibCard>

        {/* Reviews */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
            Global Activity Feed
            {reviews.length > 0 && <LibBadge variant="default" className="text-[10px] font-black h-5 min-w-[20px] px-1">{reviews.length}</LibBadge>}
          </h3>
          
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r: any) => (
                <LibCard key={r.id} className="space-y-4 group bg-card border-border/50 hover:border-accent/30 transition-all duration-300">
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
                    <div className="absolute -left-2 top-0 text-3xl opacity-10 font-serif font-black text-accent">"</div>
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
                        {r.userName} · <span className="opacity-60">{r.createdAt?.seconds ? formatDistanceToNow(new Date(r.createdAt.seconds * 1000)) + ' ago' : 'Recently'}</span>
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
  );
};

export default BookReviews;
