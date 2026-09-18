import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface ARInvoiceItem {
  ID?: number;
  LineNum: number;
  ItemID: number;
  ItemCode?: string | null;
  ItemName?: string | null;
  LineStatus?: string;
  Quantity: number;
  DeliveredQty?: number;
  OpenQty?: number;
  WhsCode?: string | null;
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
}

export interface ARInvoice {
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
  InvoiceCode?: string | null;
  CreatedByName?: string | null;
  OrderCode?: string | null;
  QuotationCode?: string | null;
  OrderId?: number | null;
  QuotationId?: number | null;
  VehicleId?: string | null;
  DriverName?: string | null;
  itemCount?: number;
  items?: ARInvoiceItem[];
  order?: { ID: number; OrderCode: string | null; DocTotal: number | null; PostDate: string | null } | null;
  quotation?: { ID: number; QuotCode: string | null; DocTotal: number | null; PostDate: string | null } | null;
}

export interface ARInvoiceInput {
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
  InvoiceCode?: string;
  DiscPrcnt?: number;
  Rounding?: string;
  RoundingAmnt?: number;
  Status?: string;
  SAPDocNum?: string;
  SAPDocEntry?: number;
  OrderId?: number;
  QuotationId?: number;
  VehicleId?: string;
  DriverName?: string;
  DriverLicenseNo?: string;
  TransporterName?: string;
  CashSales?: string;
  items: Array<{
    ItemID: number;
    ItemCode?: string;
    ItemName?: string;
    Quantity: number;
    UnitPrice: number;
    DiscPrcnt?: number;
    VATCode?: string;
    VATPer?: number;
    WhsCode?: string;
    cost_center?: number;
    project?: string;
    Remarks?: string;
    UoM?: string;
  }>;
}

export interface ARInvoicesResponse {
  success: boolean;
  invoices: ARInvoice[];
  metrics: {
    totalInvoiced: number;
    totalPaid: number;
    totalBalance: number;
    count: number;
  };
}

export const invoiceKeys = {
  all: ['ar-invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...invoiceKeys.details(), id] as const,
};

export function useARInvoices(filters: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  branchId?: number;
} = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.branchId) params.append('branchId', String(filters.branchId));

      const { data } = await api.get<ARInvoicesResponse>(`/ar-invoice?${params.toString()}`);
      return data;
    },
  });
}

export function useARInvoice(id: number | string | undefined) {
  return useQuery({
    queryKey: invoiceKeys.detail(id!),
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: ARInvoice }>(`/ar-invoice/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateARInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ARInvoiceInput) => {
      const { data } = await api.post<{ success: boolean; data: ARInvoice }>('/ar-invoice', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}

export function useUpdateARInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ARInvoiceInput }) => {
      const { data } = await api.put<{ success: boolean; data: ARInvoice }>(`/ar-invoice/${id}`, payload);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
    },
  });
}

export function useDeleteARInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/ar-invoice/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
}
