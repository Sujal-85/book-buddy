import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowApi } from '@/services/api';
import toast from 'react-hot-toast';

export const useActiveBorrows = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: ['borrows-active', params],
    queryFn: () => borrowApi.getActive().then((r: any) => r.data),
  });
};

export const useOverdueBorrows = () => {
  return useQuery({
    queryKey: ['borrows-overdue'],
    queryFn: () => borrowApi.getOverdue().then((r) => r.data),
  });
};

export const useBorrowHistory = (studentId: string) => {
  return useQuery({
    queryKey: ['borrows-history', studentId],
    queryFn: () => borrowApi.getStudentBorrows(studentId).then((r: any) => r.data),
    enabled: !!studentId,
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
    mutationFn: ({ borrowId, bookId }: { borrowId: string; bookId: string }) => borrowApi.returnBook(borrowId, bookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['borrows-active'] });
      qc.invalidateQueries({ queryKey: ['borrows-overdue'] });
      qc.invalidateQueries({ queryKey: ['books'] });
      toast.success('Book returned successfully');
    },
    onError: (err: any) => toast.error(err.message),
  });
};

export const useRequestRenewal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ borrowId, reason }: { borrowId: string; reason: string }) => 
      import('@/services/api').then(m => m.renewalApi.request(borrowId, reason)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-borrows'] });
      qc.invalidateQueries({ queryKey: ['borrows-active'] });
      toast.success('Renewal request sent to admin');
    },
    onError: (err: any) => toast.error(err.message),
  });
};
