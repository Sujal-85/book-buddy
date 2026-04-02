import React from 'react';
import { Heart, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LibCard from '@/components/ui/LibCard';
import LibButton from '@/components/ui/LibButton';
import LibBadge from '@/components/ui/LibBadge';
import toast from 'react-hot-toast';

const wishlistBooks = [
  { id: '1', title: 'Hands-On Machine Learning', author: 'Aurélien Géron', category: 'AI', available: true, addedOn: '2025-03-20' },
  { id: '2', title: 'System Design Interview', author: 'Alex Xu', category: 'Software', available: false, addedOn: '2025-03-18' },
  { id: '3', title: 'Cracking the Coding Interview', author: 'Gayle McDowell', category: 'Programming', available: true, addedOn: '2025-03-15' },
  { id: '4', title: 'Deep Learning', author: 'Ian Goodfellow', category: 'AI', available: false, addedOn: '2025-03-10' },
  { id: '5', title: 'Computer Networking', author: 'James Kurose', category: 'Networking', available: true, addedOn: '2025-03-05' },
];

const readingLists = [
  { name: 'GATE Preparation', books: 8, icon: '🎯' },
  { name: 'AI & ML Deep Dive', books: 5, icon: '🤖' },
  { name: 'Semester 6 References', books: 12, icon: '📖' },
  { name: 'Personal Growth', books: 3, icon: '🌱' },
];

const Wishlist: React.FC = () => (
  <div className="h-full flex flex-col overflow-hidden">
    <PageHeader title="My Wishlist & Reading Lists" description="Save books for later and organize your reading" />
    <div className="flex-1 overflow-y-auto space-y-6 pr-1">
      {/* Reading Lists */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {readingLists.map((list) => (
          <LibCard key={list.name} className="text-center space-y-1 cursor-pointer hover:border-accent/50 transition-colors">
            <span className="text-2xl">{list.icon}</span>
            <p className="text-sm font-medium text-foreground">{list.name}</p>
            <p className="text-xs text-muted-foreground">{list.books} books</p>
          </LibCard>
        ))}
      </div>

      {/* Wishlist */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /> Wishlist ({wishlistBooks.length})</h3>
        <div className="space-y-3">
          {wishlistBooks.map((book) => (
            <LibCard key={book.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{book.title}</p>
                  <p className="text-xs text-muted-foreground">{book.author} · Added {book.addedOn}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LibBadge variant={book.available ? 'available' : 'issued'}>{book.available ? 'Available' : 'Issued'}</LibBadge>
                {book.available && <LibButton size="sm" onClick={() => toast.success('Borrow request sent!')}>Borrow</LibButton>}
                <button onClick={() => toast.success('Removed from wishlist')} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </LibCard>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Wishlist;
