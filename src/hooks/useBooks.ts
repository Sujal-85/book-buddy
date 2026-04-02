import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { booksApi } from '@/services/api';
import toast from 'react-hot-toast';

export const useBooks = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: ['books', params],
    queryFn: () => booksApi.getAll(params).then((r) => r.data),
  });
};

export const useBook = (id: string) => {
  return useQuery({
    queryKey: ['book', id],
    queryFn: () => booksApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });
};

export const useCreateBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => booksApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book added successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => booksApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book updated successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => booksApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book deleted successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
