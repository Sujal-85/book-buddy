
import { useQuery } from '@tanstack/react-query';
import { booksApi } from '@/services/api';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => booksApi.getUniqueCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });
};
