import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/api-client';
import type { House } from '../model/types';

export const useHouses = () => {
  return useQuery({
    queryKey: ['houses'],
    queryFn: async () => {
      const response = await api.get('houses').json<{ data: House[] }>();
      
      return response.data;
    },
  });
}

export const useCreateHouse = () => {
  return useMutation({
    mutationFn: async (newHouse: Partial<House>) => {
      return await api.post('houses', { json: newHouse }).json<{ data: House }>();
    },
  });
}