import React, { useMemo } from 'react';
import { Heart, BookOpen, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@/services/api';
import { useBooks } from '@/hooks/useBooks';
import { Link } from 'react-router-dom';

const Wishlist: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: wishlistData, isLoading: isWishlistLoading } = useQuery({
    queryKey: ['wishlist', user?.uid],
    queryFn: () => wishlistApi.get(user?.uid || ''),
    enabled: !!user?.uid,
  });

  const { data: books = [] } = useBooks();

  const wishlistBooks = useMemo(() => {
    if (!wishlistData?.data) return [];
    return wishlistData.data.map((item: any) => ({
      ...item.book,
      id: item.bookId,
      wishId: item.id
    }));
  }, [wishlistData]);

  const removeMutation = useMutation({
    mutationFn: (wishId: string) => wishlistApi.remove(wishId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.uid] });
      toast.success('Removed from wishlist');
    },
    onError: () => toast.error('Failed to remove item'),
  });

  if (isWishlistLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader title="My Wishlist" description="Save books for later and organize your reading" />
      
      <div className="flex-1 overflow-y-auto space-y-8 pr-1 pb-6">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-6 uppercase tracking-widest flex items-center gap-2">
            <Heart className="h-4 w-4 text-accent fill-accent/20" />
            <span>Saved Books ({wishlistBooks.length})</span>
          </h3>
          
          {wishlistBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wishlistBooks.map((book: any) => (
                <LibCard key={book.id} className="group hover:border-accent/30 transition-all duration-300">
                  <div className="flex gap-4">
                    <div className="relative h-24 w-16 shrink-0 rounded-lg overflow-hidden border border-border/50 bg-secondary/20">
                      {book.cover ? (
                        <img src={book.cover} alt={book.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center"><BookOpen className="h-6 w-6 text-muted-foreground/30" /></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link to="/student/books" className="hover:text-accent transition-colors">
                          <h4 className="font-bold text-sm line-clamp-1">{book.title}</h4>
                        </Link>
                        <button 
                          onClick={() => removeMutation.mutate(book.wishId)}
                          disabled={removeMutation.isPending}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                      
                      <div className="mt-auto flex items-center justify-between">
                        <LibBadge variant={book.available ? 'available' : 'issued'} className="text-[9px] px-2">
                          {book.available ? 'Available' : 'Issued'}
                        </LibBadge>
                        {book.available && (
                          <LibButton size="sm" className="h-7 text-[10px] px-4 font-bold shadow-lg shadow-accent/5">
                            Borrow
                          </LibButton>
                        )}
                      </div>
                    </div>
                  </div>
                </LibCard>
              ))}
            </div>
          ) : (
            <LibCard className="py-20 text-center border-accent/10 border-dashed bg-gradient-to-b from-transparent to-accent/5">
              <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner tracking-widest">
                <Heart className="h-8 w-8 text-accent/30" />
              </div>
              <h4 className="text-lg font-bold text-foreground mb-2 uppercase tracking-widest">Your wishlist is empty</h4>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">Found a book you like? Heart it in the browse section to save it for later!</p>
              <Link to="/student/books">
                <LibButton variant="primary" size="sm" className="px-8 py-5">
                  Browse Collection <ArrowRight className="ml-2 h-4 w-4" />
                </LibButton>
              </Link>
            </LibCard>
          )}
        </div>

        {/* Categories / Lists Section */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Current & Past Borrows</h2>
          <LibBadge variant="default">0 Total</LibBadge>
        </div>
        <div className="pt-8 border-t border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Personal Collections</h3>
            <LibButton variant="ghost" size="sm" className="h-8 text-[10px]">Create Collection</LibButton>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <CollectionCard icon="📚" name="To Read" count={wishlistBooks.length} />
            <CollectionCard icon="🎓" name="GATE Prep" count={0} />
            <CollectionCard icon="💻" name="Coding" count={0} />
            <CollectionCard icon="🚀" name="Future" count={0} />
          </div>
        </div>
      </div>
    </div>
  );
};

const CollectionCard = ({ icon, name, count }: { icon: string, name: string, count: number }) => (
  <LibCard className="text-center group p-6 cursor-pointer border-border/50 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300">
    <span className="text-4xl mb-3 block group-hover:scale-125 transition-transform duration-500 drop-shadow-sm">{icon}</span>
    <p className="text-sm font-bold text-foreground mb-1">{name}</p>
    <p className="text-[10px] font-black text-accent uppercase tracking-tighter opacity-60 group-hover:opacity-100">{count} BOOKS</p>
  </LibCard>
);

export default Wishlist;
