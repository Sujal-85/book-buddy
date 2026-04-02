import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookSchema, type BookFormData } from '@/utils/validators';
import { Search, Plus, Edit2, Trash2, BookPlus } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import LibInput from '@/components/ui/LibInput';
import LibTable from '@/components/ui/LibTable';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import PageHeader from '@/components/layout/PageHeader';
import type { Column } from '@/components/ui/LibTable';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  status: string;
  cover?: string;
}

const demoBooks: Book[] = [
  { id: '1', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', category: 'Programming', totalCopies: 5, availableCopies: 3, status: 'available' },
  { id: '2', title: 'Design Patterns', author: 'Gang of Four', isbn: '9780201633610', category: 'Programming', totalCopies: 3, availableCopies: 0, status: 'issued' },
  { id: '3', title: 'The Pragmatic Programmer', author: 'David Thomas', isbn: '9780135957059', category: 'Programming', totalCopies: 4, availableCopies: 2, status: 'available' },
  { id: '4', title: 'Refactoring', author: 'Martin Fowler', isbn: '9780134757599', category: 'Programming', totalCopies: 2, availableCopies: 0, status: 'overdue' },
  { id: '5', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', category: 'Computer Science', totalCopies: 6, availableCopies: 4, status: 'available' },
  { id: '6', title: 'Artificial Intelligence', author: 'Stuart Russell', isbn: '9780136042594', category: 'AI', totalCopies: 3, availableCopies: 1, status: 'available' },
  { id: '7', title: 'Database Systems', author: 'Ramez Elmasri', isbn: '9780133970777', category: 'Database', totalCopies: 4, availableCopies: 3, status: 'available' },
  { id: '8', title: 'Computer Networks', author: 'Andrew Tanenbaum', isbn: '9780132126953', category: 'Networking', totalCopies: 3, availableCopies: 0, status: 'issued' },
];

const categories = ['All', 'Programming', 'Computer Science', 'AI', 'Database', 'Networking', 'Mathematics'];
const availabilities = ['All', 'Available', 'Issued', 'Overdue'];

const AdminBooks: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [availability, setAvailability] = useState('All');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
  });

  const filtered = demoBooks.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || b.category === category;
    const matchAvailability = availability === 'All' || b.status === availability.toLowerCase();
    return matchSearch && matchCategory && matchAvailability;
  });

  const perPage = 10;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginatedBooks = filtered.slice((page - 1) * perPage, page * perPage);

  const columns: Column<Book>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-10 bg-secondary rounded flex items-center justify-center text-xs text-muted-foreground">📚</div>
          <div>
            <p className="font-medium text-foreground">{b.title}</p>
            <p className="text-xs text-muted-foreground">{b.isbn}</p>
          </div>
        </div>
      ),
    },
    { key: 'author', header: 'Author' },
    { key: 'category', header: 'Category', render: (b) => <LibBadge>{b.category}</LibBadge> },
    { key: 'copies', header: 'Copies', render: (b) => `${b.availableCopies}/${b.totalCopies}` },
    {
      key: 'status',
      header: 'Status',
      render: (b) => <LibBadge variant={b.status as 'available' | 'issued' | 'overdue'}>{b.status}</LibBadge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (b) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditBook(b); setShowAddModal(true); }} className="p-1 hover:bg-secondary rounded text-muted-foreground"><Edit2 className="h-4 w-4" /></button>
          <button onClick={() => setDeleteBook(b)} className="p-1 hover:bg-secondary rounded text-destructive"><Trash2 className="h-4 w-4" /></button>
          <LibButton size="sm" variant="secondary"><BookPlus className="h-3 w-3 mr-1" /> Issue</LibButton>
        </div>
      ),
    },
  ];

  const onSubmit = (data: BookFormData) => {
    console.log('Book data:', data);
    setShowAddModal(false);
    setEditBook(null);
    reset();
  };

  return (
    <div>
      <PageHeader
        title="Books Management"
        description="Manage your library collection"
        action={
          <LibButton onClick={() => { setEditBook(null); reset(); setShowAddModal(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Book
          </LibButton>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-md border border-input bg-background text-sm">
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="px-3 py-2 rounded-md border border-input bg-background text-sm">
          {availabilities.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <LibCard className="p-0">
        <LibTable columns={columns} data={paginatedBooks} keyExtractor={(b) => b.id} />
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </LibCard>

      {/* Add/Edit Modal */}
      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setEditBook(null); }}
        title={editBook ? 'Edit Book' : 'Add New Book'}
        footer={
          <>
            <LibButton variant="ghost" onClick={() => { setShowAddModal(false); setEditBook(null); }}>Cancel</LibButton>
            <LibButton onClick={handleSubmit(onSubmit)}>{editBook ? 'Update' : 'Add Book'}</LibButton>
          </>
        }
      >
        <form className="space-y-4">
          <LibInput label="Title" defaultValue={editBook?.title} {...register('title')} error={errors.title?.message} />
          <LibInput label="Author" defaultValue={editBook?.author} {...register('author')} error={errors.author?.message} />
          <LibInput label="ISBN" defaultValue={editBook?.isbn} {...register('isbn')} error={errors.isbn?.message} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">Category</label>
            <select defaultValue={editBook?.category} {...register('category')} className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm">
              <option value="">Select category</option>
              {categories.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>
          <LibInput label="Total Copies" type="number" defaultValue={editBook?.totalCopies} {...register('totalCopies')} error={errors.totalCopies?.message} />
          <LibInput label="Publisher" {...register('publisher')} error={errors.publisher?.message} />
          <LibInput label="Year" type="number" {...register('year')} error={errors.year?.message} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteBook}
        onClose={() => setDeleteBook(null)}
        onConfirm={() => setDeleteBook(null)}
        title="Delete Book"
        message={`Are you sure you want to delete "${deleteBook?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default AdminBooks;
