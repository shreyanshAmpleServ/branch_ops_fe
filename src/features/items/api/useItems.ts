import { useQuery } from '@tanstack/react-query';
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
}

export interface ItemsParams {
  page?: number;
  limit?: number;
  search?: string;
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
  };
}

export function useItems(params: ItemsParams = {}) {
  return useQuery<ItemsResponse>({
    queryKey: ['items', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.search) queryParams.set('search', params.search);

      const { data } = await api.get<ItemsResponse>(`/items?${queryParams}`);
      return data;
    },
    staleTime: 30_000,
  });
}
