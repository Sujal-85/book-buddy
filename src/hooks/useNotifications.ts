import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/api';
import toast from 'react-hot-toast';

export const useNotifications = (studentId?: string) => {
  return useQuery({
    queryKey: ['notifications', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data } = await notificationsApi.getAll(studentId);
      return data;
    },
    enabled: !!studentId,
    refetchInterval: 30000,
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });
};

export const useSendReminder = () => {
  return useMutation({
    mutationFn: (borrowId: string) => notificationsApi.sendReminder(borrowId),
    onSuccess: () => toast.success('Reminder sent'),
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useSendBulkReminders = () => {
  return useMutation({
    mutationFn: () => notificationsApi.sendBulkReminders(),
    onSuccess: () => toast.success('All reminders sent'),
    onError: (err: Error) => toast.error(err.message),
  });
};
