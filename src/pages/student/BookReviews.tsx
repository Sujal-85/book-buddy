import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp, BookOpen } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const reviews = [
  { id: '1', book: 'Clean Code', author: 'Robert Martin', reviewer: 'Priya S.', rating: 5, review: 'Must-read for every programmer. Changed how I write code.', likes: 24, date: '2025-03-20' },
  { id: '2', book: 'Design Patterns', author: 'Gang of Four', reviewer: 'Amit K.', rating: 4, review: 'Excellent reference book. Dense but incredibly valuable for OOP understanding.', likes: 18, date: '2025-03-18' },
  { id: '3', book: 'Introduction to Algorithms', author: 'Thomas Cormen', reviewer: 'Rahul P.', rating: 4, review: 'Comprehensive but challenging. Great for GATE prep. Take it slow.', likes: 32, date: '2025-03-15' },
  { id: '4', book: 'The Pragmatic Programmer', author: 'David Thomas', reviewer: 'Sneha D.', rating: 5, review: 'Practical wisdom for software developers. Every tip is gold.', likes: 15, date: '2025-03-12' },
];

const BookReviews: React.FC = () => {
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="Book Reviews & Ratings" description="Read and write reviews to help fellow students choose books" />
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Write Review */}
        <LibCard className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><MessageSquare className="h-4 w-4 text-accent" /> Write a Review</h3>
          <input placeholder="Select a book you've read..." className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className="p-1">
                <Star className={`h-5 w-5 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
              </button>
            ))}
          </div>
          <textarea value={newReview} onChange={(e) => setNewReview(e.target.value)} placeholder="Share your thoughts about this book..." rows={3} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          <LibButton onClick={() => { toast.success('Review submitted!'); setNewReview(''); setRating(0); }}>Submit Review</LibButton>
        </LibCard>

        {/* Reviews */}
        <div className="space-y-3">
          {reviews.map((r) => (
            <LibCard key={r.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.book}</p>
                    <p className="text-xs text-muted-foreground">by {r.author}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />)}</div>
              </div>
              <p className="text-sm text-foreground">{r.review}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{r.reviewer} · {r.date}</p>
                <button onClick={() => toast.success('Liked!')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ThumbsUp className="h-3 w-3" /> {r.likes}
                </button>
              </div>
            </LibCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookReviews;
