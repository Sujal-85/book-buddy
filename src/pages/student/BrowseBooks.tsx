import React, { useState, useMemo } from 'react';
import { Search, BookOpen } from 'lucide-react';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import LibButton from '@/components/ui/LibButton';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/layout/PageHeader';
import toast from 'react-hot-toast';

const allBooks = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  title: ['Clean Code', 'Design Patterns', 'The Pragmatic Programmer', 'Refactoring', 'Introduction to Algorithms', 'Artificial Intelligence', 'Database Systems', 'Computer Networks', 'Operating Systems', 'Software Engineering'][i % 10],
  author: ['Robert Martin', 'Gang of Four', 'David Thomas', 'Martin Fowler', 'Thomas Cormen', 'Stuart Russell', 'Ramez Elmasri', 'Andrew Tanenbaum', 'Silberschatz', 'Ian Sommerville'][i % 10],
  category: ['Programming', 'Programming', 'Programming', 'Programming', 'Computer Science', 'AI', 'Database', 'Networking', 'OS', 'Software'][i % 10],
  available: i % 3 !== 0,
}));

const categories = ['Programming', 'Computer Science', 'AI', 'Database', 'Networking', 'OS', 'Software'];

const BrowseBooks: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return allBooks.filter((b) => {
      const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(b.category);
      const matchAvail = !showAvailableOnly || b.available;
      return matchSearch && matchCategory && matchAvail;
    });
  }, [search, selectedCategories, showAvailableOnly]);

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
    <div>
      <PageHeader title="Browse Books" description="Discover and borrow books from our collection" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-56 shrink-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search books..."
              className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <LibCard>
            <h4 className="text-sm font-semibold text-foreground mb-3">Categories</h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="rounded border-input"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </LibCard>

          <LibCard>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => { setShowAvailableOnly(e.target.checked); setPage(1); }}
                className="rounded border-input"
              />
              Available only
            </label>
          </LibCard>
        </div>

        {/* Books Grid */}
        <div className="flex-1">
          {paginated.length === 0 ? (
            <EmptyState title="No books found" message="Try adjusting your filters or search terms." />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginated.map((book) => (
                  <LibCard key={book.id} className="space-y-3">
                    <div className="h-36 bg-secondary rounded-md flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <LibBadge>{book.category}</LibBadge>
                      <LibBadge variant={book.available ? 'available' : 'issued'}>
                        {book.available ? 'Available' : 'Issued'}
                      </LibBadge>
                    </div>
                    {book.available ? (
                      <LibButton size="sm" className="w-full" onClick={() => toast.success('Borrow request sent!')}>
                        Borrow Request
                      </LibButton>
                    ) : (
                      <LibButton size="sm" variant="ghost" className="w-full" disabled>
                        Not Available
                      </LibButton>
                    )}
                  </LibCard>
                ))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowseBooks;
