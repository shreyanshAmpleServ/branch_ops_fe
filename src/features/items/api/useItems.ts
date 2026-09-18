import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface ApiItem {
  id: number;
  code: string | null;
  name: string;
  createdDate: string | null;
  catId: number | null;
  categoryName: string | null;
  subCatId: number | null;
  onHand: number;
  isCommited: number;
  onOrder: number;
  dfltWhsId: number | null;
  warehouseName: string | null;
  uom: string | null;
  qtyInCase: number;
  minQtyLevel: number;
  maxQtyLevel: number;
  lastPurPrc: number;
  weight: number;
  saleVAT: number | null;
  remarks: string | null;
  monthlyTargetQty: number;
  dailyTargetQty: number;
  posItem?: string;
  itemPurchased?: string;
  itemSales?: string;
  itemInventory?: string;
  gl?: string | null;
  glName?: string | null;
}

export interface ItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  catId?: number;
  whsId?: number;
  lowStock?: boolean;
}

export interface ItemsResponse {
  status: string;
  items: ApiItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    inStock?: number;
    lowStock?: number;
    totalValuation?: number;
  };
}

export interface CategoryItem {
  id: number;
  code: string;
  name: string;
}

export function useItems(params: ItemsParams = {}) {
  return useQuery<ItemsResponse>({
    queryKey: ['items', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.search) queryParams.set('search', params.search);
      if (params.catId) queryParams.set('catId', String(params.catId));
      if (params.whsId) queryParams.set('whsId', String(params.whsId));
      if (params.lowStock) queryParams.set('lowStock', 'true');

      const { data } = await api.get<ItemsResponse>(`/items?${queryParams}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useItemCategories() {
  return useQuery<CategoryItem[]>({
    queryKey: ['item-categories'],
    queryFn: async () => {
      const { data } = await api.get<{ status: string; data: CategoryItem[] }>('/items/categories');
      return data.data || [];
    },
    staleTime: 60_000,
  });
}

export const useCategories = useItemCategories;

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ApiItem>) => {
      const { data } = await api.post('/items', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['master-items'] });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: number; data: Partial<ApiItem> }) => {
      const { data } = await api.put(`/items/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['master-items'] });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/items/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['master-items'] });
    },
  });
}
