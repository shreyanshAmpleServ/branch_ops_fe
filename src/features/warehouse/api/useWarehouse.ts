import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface ApiWarehouse {
  id: number;
  code: string;
  name: string;
  createdDate: string | null;
  street: string | null;
  block: string | null;
  zipCode: string | null;
  city: number | null;
  county: string | null;
  country: number | null;
  state: number | null;
  location: string | null;
}

export interface WarehouseParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface WarehouseResponse {
  status: string;
  warehouses: ApiWarehouse[];
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

export interface WarehouseStockItem {
  id: number;
  code: string;
  name: string;
  categoryName?: string | null;
  uom?: string | null;
  onHand: number;
  isCommited: number;
  onOrder: number;
  minQtyLevel: number;
  maxQtyLevel: number;
  lastPurPrc: number;
  totalValuation: number;
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
}

export interface WarehouseItemsResponse {
  status: string;
  warehouse: ApiWarehouse;
  items: WarehouseStockItem[];
  stats: {
    totalItems: number;
    inStockCount: number;
    totalValuation: number;
  };
}

export function useWarehouses(params: WarehouseParams = {}) {
  return useQuery<WarehouseResponse>({
    queryKey: ['warehouses', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.search) queryParams.set('search', params.search);

      const { data } = await api.get<WarehouseResponse>(`/warehouse?${queryParams}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useWarehouseItems(whsId: number | null | undefined) {
  return useQuery<WarehouseItemsResponse>({
    queryKey: ['warehouse-items', whsId],
    queryFn: async () => {
      const { data } = await api.get<WarehouseItemsResponse>(`/warehouse/${whsId}/items`);
      return data;
    },
    enabled: !!whsId,
    staleTime: 30_000,
  });
}
