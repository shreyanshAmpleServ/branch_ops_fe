import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface OrderItem {
  ID?: number;
  LineNum: number;
  ItemID: number;
  ItemCode?: string | null;
  ItemName?: string | null;
  LineStatus?: string;
  Quantity: number;
  DeliveredQty?: number;
  OpenQty?: number;
  WhsCode?: number | null;
  UnitPrice: number;
  DiscPrcnt?: number | null;
  VATCode?: string | null;
  VATPer?: number | null;
  LineTax?: number | null;
  LineTotalLC?: number | null;
  TotalBefDisc?: number | null;
  cost_center?: number | null;
  project?: string | null;
  Remarks?: string | null;
  UoM?: string | null;
  Items?: {
    ID: number;
    Code?: string | null;
    Name: string;
  } | null;
  Warehouses?: {
    ID: number;
    Code: string;
    Name: string;
  } | null;
}

export interface SalesOrder {
  ID: number;
  CustCode: string;
  CustName: string;
  Address?: string | null;
  CustRefNo?: string | null;
  Currency?: string | null;
  CurRate?: number | null;
  PostDate?: string | null;
  DueDate?: string | null;
  TaxDate?: string | null;
  DiscPrcnt?: number | null;
  TaxTotal?: number | null;
  DocTotal?: number | null;
  TotalBefDisc?: number | null;
  Remarks?: string | null;
  Status?: string | null;
  SAPDocNum?: string | null;
  SAPDocEntry?: number | null;
  CreatedDate?: string | null;
  OrderCode?: string | null;
  CreatedByName?: string | null;
  QuotationCode?: string | null;
  QuotationId?: number | null;
  VehicleId?: string | null;
  DriverName?: string | null;
  itemCount?: number;
  invoiceCount?: number;
  items?: OrderItem[];
  quotation?: { ID: number; QuotCode: string | null; DocTotal: number | null; PostDate: string | null } | null;
  ar_invoices?: Array<{ ID: number; InvoiceCode: string | null; DocTotal: number | null; Status: string | null }>;
}

export interface SalesOrderInput {
  CustCode: string;
  CustName?: string;
  Address?: string;
  CustRefNo?: string;
  Currency?: string;
  CurRate?: number;
  PostDate?: string;
  DueDate?: string;
  TaxDate?: string;
  Remarks?: string;
  Branch_id?: number;
  OrderCode?: string;
  DiscPrcnt?: number;
  Rounding?: string;
  RoundingAmnt?: number;
  Status?: string;
  SAPDocNum?: string;
  SAPDocEntry?: number;
  QuotationId?: number;
  VehicleId?: string;
  DriverName?: string;
  items: Array<{
    ItemID: number;
    ItemCode?: string;
    ItemName?: string;
    Quantity: number;
    UnitPrice: number;
    DiscPrcnt?: number;
    VATCode?: string;
    VATPer?: number;
    WhsCode?: number;
    cost_center?: number;
    project?: string;
    Remarks?: string;
    UoM?: string;
  }>;
}

export const orderKeys = {
  all: ['sales-orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...orderKeys.details(), id] as const,
};

export function useSalesOrders(filters: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  branchId?: number;
} = {}) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', String(filters.branchId));

      const { data } = await api.get<{ success: boolean; data: SalesOrder[] }>(`/orders?${params.toString()}`);
      return data.data;
    },
  });
}

export function useSalesOrder(id: number | string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id!),
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: SalesOrder }>(`/orders/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SalesOrderInput) => {
      const { data } = await api.post<{ success: boolean; data: SalesOrder }>('/orders', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: SalesOrderInput }) => {
      const { data } = await api.put<{ success: boolean; data: SalesOrder }>(`/orders/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
}

export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
