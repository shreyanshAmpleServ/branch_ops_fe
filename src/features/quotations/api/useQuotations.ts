import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface QuotationItem {
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
    OnHand?: number | null;
  } | null;
  Warehouses?: {
    ID: number;
    Code: string;
    Name: string;
  } | null;
}

export interface Quotation {
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
  QuotCode?: string | null;
  CreatedByName?: string | null;
  itemCount?: number;
  orderCount?: number;
  items?: QuotationItem[];
  orders?: Array<{ ID: number; OrderCode: string | null; DocTotal: number | null; Status: string | null }>;
}

export interface QuotationInput {
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
  QuotCode?: string;
  DiscPrcnt?: number;
  Rounding?: string;
  RoundingAmnt?: number;
  Status?: string;
  SAPDocNum?: string;
  SAPDocEntry?: number;
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

export const quotationKeys = {
  all: ['quotations'] as const,
  lists: () => [...quotationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...quotationKeys.lists(), filters] as const,
  details: () => [...quotationKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...quotationKeys.details(), id] as const,
};

export function useQuotations(filters: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  branchId?: number;
} = {}) {
  return useQuery({
    queryKey: quotationKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', String(filters.branchId));

      const { data } = await api.get<{ success: boolean; data: Quotation[] }>(`/quotations?${params.toString()}`);
      return data.data;
    },
  });
}

export function useQuotation(id: number | string | undefined) {
  return useQuery({
    queryKey: quotationKeys.detail(id!),
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Quotation }>(`/quotations/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: QuotationInput) => {
      const { data } = await api.post<{ success: boolean; data: Quotation }>('/quotations', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: QuotationInput }) => {
      const { data } = await api.put<{ success: boolean; data: Quotation }>(`/quotations/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(id) });
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
}
