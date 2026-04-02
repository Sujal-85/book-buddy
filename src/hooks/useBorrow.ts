import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowApi } from '@/services/api';
import toast from 'react-hot-toast';

export const useActiveBorrows = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: ['borrows-active', params],
    queryFn: () => borrowApi.getActive(params).then((r) => r.data),
  });
};

export const useOverdueBorrows = () => {
  return useQuery({
    queryKey: ['borrows-overdue'],
    queryFn: () => borrowApi.getOverdue().then((r) => r.data),
  });
};

export const useBorrowHistory = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: ['borrows-history', params],
    queryFn: () => borrowApi.getHistory(params).then((r) => r.data),
  });
};

export const useStudentBorrows = (studentId: string) => {
  return useQuery({
    queryKey: ['student-borrows', studentId],
    queryFn: () => borrowApi.getStudentBorrows(studentId).then((r) => r.data),
    enabled: !!studentId,
  });
};

export const useIssueBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentId: string; bookId: string; dueDate: string }) => borrowApi.issue(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['borrows-active'] });
      qc.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book issued successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useReturnBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: { finePaid?: boolean } }) => borrowApi.return(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['borrows-active'] });
      qc.invalidateQueries({ queryKey: ['borrows-overdue'] });
      qc.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book returned successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
