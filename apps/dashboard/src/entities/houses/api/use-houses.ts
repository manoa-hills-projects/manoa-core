import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/shared/api/api-client';
import type { House } from '../model/types';
import type { PaginationState } from '@tanstack/react-table';

export const useHouses = (pagination: PaginationState, filters?: { search?: string }) => {
  return useQuery({
    queryKey: ['houses', pagination, filters],
    queryFn: async () => {
      const response = await api
        .get('houses', {
          searchParams: {
            page: pagination.pageIndex,
            limit: pagination.pageSize,
            search: filters?.search,
          },
        })
        .json<ApiResponse<House>>();

      return response
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateHouse = () => {
  return useMutation({
    mutationFn: async (newHouse: Partial<House>) => {
      return await api.post('houses', { json: newHouse }).json<{ data: House }>();
    },
  });
};