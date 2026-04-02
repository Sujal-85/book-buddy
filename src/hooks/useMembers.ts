import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '@/services/api';
import toast from 'react-hot-toast';

export const useMembers = (params?: Record<string, string>) => {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => membersApi.getAll(params).then((r) => r.data),
  });
};

export const useMember = (id: string) => {
  return useQuery({
    queryKey: ['member', id],
    queryFn: () => membersApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });
};

export const useCreateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => membersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member added successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => membersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member updated successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] });
      toast.success('Member deleted successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
