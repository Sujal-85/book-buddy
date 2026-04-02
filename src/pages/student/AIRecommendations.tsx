import React, { useState } from 'react';
import { Sparkles, BookOpen, ThumbsUp, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const recommendations = [
  { id: '1', title: 'Python Machine Learning', author: 'Sebastian Raschka', category: 'AI', match: 95, reason: 'Based on your interest in AI & Data Science' },
  { id: '2', title: 'Hands-On Deep Learning', author: 'Aurélien Géron', category: 'AI', match: 91, reason: 'Similar readers also enjoyed this' },
  { id: '3', title: 'The Algorithm Design Manual', author: 'Steven Skiena', category: 'Computer Science', match: 87, reason: 'Complements your Algorithms coursework' },
  { id: '4', title: 'Cracking the Coding Interview', author: 'Gayle McDowell', category: 'Programming', match: 84, reason: 'Popular among final year students' },
  { id: '5', title: 'System Design Interview', author: 'Alex Xu', category: 'Software', match: 82, reason: 'Trending among your department' },
  { id: '6', title: 'Clean Architecture', author: 'Robert Martin', category: 'Programming', match: 78, reason: "You enjoyed 'Clean Code' by the same author" },
];

const AIRecommendations: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); toast.success('Recommendations updated!'); }, 1500);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="AI Book Recommendations" description="Personalized reading suggestions based on your history and interests"
        action={<LibButton size="sm" onClick={refresh} disabled={loading} className="flex items-center gap-2">{loading ? <><RefreshCw className="h-3 w-3 animate-spin" /> Refreshing...</> : <><Sparkles className="h-3 w-3" /> Refresh</>}</LibButton>} />
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {recommendations.map((book) => (
            <LibCard key={book.id} className="space-y-3">
              <div className="h-32 bg-secondary rounded-md flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{book.title}</p>
                <p className="text-xs text-muted-foreground">{book.author}</p>
              </div>
              <div className="flex items-center justify-between">
                <LibBadge>{book.category}</LibBadge>
                <span className="text-xs font-bold text-accent">{book.match}% match</span>
              </div>
              <p className="text-xs text-muted-foreground italic">💡 {book.reason}</p>
              <div className="flex gap-2">
                <LibButton size="sm" className="flex-1" onClick={() => toast.success('Borrow request sent!')}>Borrow</LibButton>
                <LibButton size="sm" variant="ghost" onClick={() => toast.success('Added to wishlist!')}><ThumbsUp className="h-3 w-3" /></LibButton>
              </div>
            </LibCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
