import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface PriceListItem {
  id: number;
  code: string;
  name: string;
  createdDate?: string | null;
  priceType?: number;
}

export interface ItemPriceRow {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  catId?: number | null;
  categoryName?: string | null;
  dfltWhsId?: number | null;
  warehouseName?: string | null;
  uom?: string | null;
  qtyInCase?: number;
  onHand?: number;
  isCommited?: number;
  onOrder?: number;
  remarks?: string | null;
  priceListId: number;
  priceListName: string;
  priceListCode?: string;
  price: number;
  isPriced?: boolean;
  lastPurPrc: number;
  marginPercent: number;
  currency: string;
}

export interface ItemPricesParams {
  page?: number;
  limit?: number;
  search?: string;
  priceListId?: number;
  catId?: number;
  whsId?: number;
}

export interface ItemPricesResponse {
  status: string;
  priceLists: PriceListItem[];
  activePriceList: PriceListItem;
  itemPrices: ItemPriceRow[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    totalItems: number;
    totalPricedItems: number;
    activePriceListsCount: number;
    avgMargin: number;
    highestPrice: number;
  };
}

export function usePriceLists() {
  return useQuery<{ status: string; data: PriceListItem[] }>({
    queryKey: ['price-lists'],
    queryFn: async () => {
      const { data } = await api.get('/item-prices/price-lists');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useItemPrices(params: ItemPricesParams = {}) {
  return useQuery<ItemPricesResponse>({
    queryKey: ['item-prices', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.search) queryParams.set('search', params.search);
      if (params.priceListId) queryParams.set('priceListId', String(params.priceListId));
      if (params.catId) queryParams.set('catId', String(params.catId));
      if (params.whsId) queryParams.set('whsId', String(params.whsId));

      const { data } = await api.get<ItemPricesResponse>(`/item-prices?${queryParams}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateItemPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { priceListId: number; itemId: number; price: number; currency?: string }) => {
      const { data } = await api.post('/item-prices/upsert', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-prices'] });
    },
  });
}

export function useBulkUpdateItemPrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { priceListId: number; updates: { itemId: number; price: number }[] }) => {
      const { data } = await api.post('/item-prices/bulk', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-prices'] });
    },
  });
}

export function useCreatePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { code?: string; name: string; priceType?: number }) => {
      const { data } = await api.post('/item-prices/price-lists', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
      queryClient.invalidateQueries({ queryKey: ['item-prices'] });
    },
  });
}
