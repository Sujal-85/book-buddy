import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookSchema, type BookFormData } from '@/utils/validators';
import { Search, Plus, Edit2, Trash2, BookPlus, Database } from 'lucide-react';
import LibButton from '@/components/ui/LibButton';
import LibCard from '@/components/ui/LibCard';
import LibBadge from '@/components/ui/LibBadge';
import LibInput from '@/components/ui/LibInput';
import LibTable from '@/components/ui/LibTable';
import Modal, { ConfirmDialog } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import PageHeader from '@/components/layout/PageHeader';
import type { Column } from '@/components/ui/LibTable';
import { useBooks, useCreateBook, useUpdateBook, useDeleteBook } from '@/hooks/useBooks';
import { fetchBookByISBN } from '@/lib/googleBooks';
import { seedBooks } from '@/utils/seedBooks';
import toast from 'react-hot-toast';

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
  const [isbnInput, setIsbnInput] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const { data: books = [], isLoading, refetch } = useBooks({
    search,
    category: category !== 'All' ? category : undefined
  });

  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const removeBook = useDeleteBook();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
  });

  const filtered = books.filter((b: any) => {
    const matchAvailability = availability === 'All' || b.status === availability.toLowerCase();
    return matchAvailability;
  });

  const perPage = 10;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginatedBooks = filtered.slice((page - 1) * perPage, page * perPage);

  const handleIsbnLookup = async () => {
    if (!isbnInput || isbnInput.length < 10) {
      toast.error('Please enter a valid ISBN');
      return;
    }

    setIsLookingUp(true);
    const bookData = await fetchBookByISBN(isbnInput);
    setIsLookingUp(false);

    if (bookData) {
      const { volumeInfo } = bookData;
      reset({
        title: volumeInfo.title,
        author: volumeInfo.authors?.join(', ') || '',
        isbn: isbnInput,
        category: volumeInfo.categories?.[0] || '',
        description: volumeInfo.description || '',
        totalCopies: 1,
        publisher: volumeInfo.publisher || '',
        year: volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear() : undefined,
      } as any);
      toast.success('Book details fetched!');
    } else {
      toast.error('Book not found. Please enter details manually.');
    }
  };

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const count = await seedBooks();
      if (count) {
        toast.success(`Successfully seeded ${count} books!`);
        refetch();
      } else {
        toast.error('Books already exist or seeding failed.');
      }
    } catch (error) {
      toast.error('Failed to seed books');
    } finally {
      setIsSeeding(false);
    }
  };

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
    if (editBook) {
      updateBook.mutate({ id: editBook.id, data: data as any }, {
        onSuccess: () => {
          setShowAddModal(false);
          setEditBook(null);
          reset();
        }
      });
    } else {
      createBook.mutate(data as any, {
        onSuccess: () => {
          setShowAddModal(false);
          setIsbnInput('');
          reset();
        }
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Books Management"
        description="Manage your library collection"
        action={
          <div className="flex gap-2">
            {books.length === 0 && (
              <LibButton
                variant="secondary"
                onClick={handleSeed}
                loading={isSeeding}
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Seed Library
              </LibButton>
            )}
            <LibButton onClick={() => { setEditBook(null); reset(); setShowAddModal(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Book
            </LibButton>
          </div>
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
        <LibTable columns={columns} data={paginatedBooks} keyExtractor={(b) => b.id} isLoading={isLoading} />
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </LibCard>

      {/* Add/Edit Modal */}
      <Modal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setEditBook(null); setIsbnInput(''); }}
        title={editBook ? 'Edit Book' : 'Add New Book'}
        footer={
          <>
            <LibButton variant="ghost" onClick={() => { setShowAddModal(false); setEditBook(null); }}>Cancel</LibButton>
            <LibButton 
              onClick={handleSubmit(onSubmit)} 
              loading={createBook.isPending || updateBook.isPending}
            >
              {editBook ? 'Update' : 'Add Book'}
            </LibButton>
          </>
        }
      >
        <form className="space-y-4">
          {!editBook && (
            <div className="flex gap-2 items-end mb-4 p-3 bg-secondary/30 rounded-lg">
              <div className="flex-1">
                <LibInput 
                  label="Quick Add by ISBN" 
                  placeholder="Enter 10 or 13 digit ISBN" 
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                />
              </div>
              <LibButton 
                type="button" 
                variant="secondary" 
                onClick={handleIsbnLookup}
                loading={isLookingUp}
              >
                Fetch
              </LibButton>
            </div>
          )}
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
        onConfirm={() => removeBook.mutate(deleteBook!.id, { onSuccess: () => setDeleteBook(null) })}
        title="Delete Book"
        message={`Are you sure you want to delete "${deleteBook?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={removeBook.isPending}
      />
    </div>
  );
};

export default AdminBooks;
