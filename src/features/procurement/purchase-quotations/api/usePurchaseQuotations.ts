import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../lib/api';

export interface PurchaseQuotationItem {
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
  Currency?: number | null;
  Rate?: number | null;
  DiscPrcnt?: number | null;
  VATCode?: string | null;
  VATPer?: number | null;
  LineTax?: number | null;
  LineTotalLC?: number | null;
  cost_center?: number | null;
  project?: string | null;
  Remarks?: string | null;
  CGuid?: string;
  UoM?: string | null;
  vendor?: string | null;
  DIM1?: string | null;
  DIM2?: string | null;
  DIM3?: string | null;
  DIM4?: string | null;
  DIM5?: string | null;
  ferightType?: string | null;
  vendorRef?: string | null;
  po_id?: string | null;
  Location?: string | null;
}

export interface PurchaseQuotationAttachment {
  ID?: number;
  LineNum: number;
  Attachment: string;
  CGuid?: string;
}

export interface PurchaseQuotation {
  ID: number;
  CustCode: string;
  CustName: string | null;
  Address: string | null;
  CustRefNo: string | null;
  ContPerson: number | null;
  Currency: string | null;
  CurRate: number | string | null;
  PostDate: string | null;
  DueDate: string | null;
  TaxDate: string | null;
  DiscPrcnt: number | string | null;
  TaxTotal: number | string | null;
  DocTotal: number | string | null;
  DocTotalFC: number | string | null;
  DocTotalSC: number | string | null;
  Rounding: string | null;
  RoundingAmnt: number | string | null;
  Freight: number | string | null;
  Remarks: string | null;
  Status: string;
  CreatedDate: string;
  CGuid: string;
  DueDateString: string | null;
  TotalBefDisc: number | string | null;
  AprStatus: string;
  AprBy: string | number | null;
  AprDate: string | null;
  AprRemark: string | null;
  CreatedBy: number | null;
  UpdatedBy: number | null;
  UpdatedDate: string | null;
  Branch_id: number | null;
  QuotCode: string | null;
  SAPDocNum: string | number | null;
  Department?: string | null;
  RequestType?: string | null;
  TypeRequest?: string | null;
  PurchaseRequestId?: number | null;
  Pr_ID?: string | null;
  CreatedByName?: string | null;
  items?: PurchaseQuotationItem[];
  attachments?: PurchaseQuotationAttachment[];
}

export interface PurchaseQuotationInput {
  CustCode: string;
  CustName?: string | null;
  Address?: string | null;
  CustRefNo?: string | null;
  Currency?: string | null;
  CurRate?: number | null;
  PostDate?: string | null;
  DueDate?: string | null;
  TaxDate?: string | null;
  Remarks?: string | null;
  Branch_id?: number | null;
  QuotCode?: string | null;
  DiscPrcnt?: number | null;
  Rounding?: string | null;
  RoundingAmnt?: number | null;
  Freight?: number | null;
  Department?: string | null;
  RequestType?: string | null;
  TypeRequest?: string | null;
  PurchaseRequestId?: number | null;
  Pr_ID?: string | null;
  items: PurchaseQuotationItem[];
  attachments?: { LineNum?: number; Attachment: string }[];
}

export const purchaseQuotationKeys = {
  all: ['purchase-quotations'] as const,
  lists: () => [...purchaseQuotationKeys.all, 'list'] as const,
  list: (filters: any) => [...purchaseQuotationKeys.lists(), filters] as const,
  details: () => [...purchaseQuotationKeys.all, 'detail'] as const,
  detail: (id: number) => [...purchaseQuotationKeys.details(), id] as const,
};

interface ApiResponse<T> {
  status: string;
  data: T;
}

export function usePurchaseQuotations(filters: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  branchId?: number;
} = {}) {
  return useQuery({
    queryKey: purchaseQuotationKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PurchaseQuotation[]>>('/purchase-quotations', {
        params: filters,
      });
      return data.data || [];
    },
  });
}

export function usePurchaseQuotation(id: number | null) {
  return useQuery({
    queryKey: purchaseQuotationKeys.detail(id || 0),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PurchaseQuotation>>(`/purchase-quotations/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PurchaseQuotationInput) => {
      const { data } = await api.post<ApiResponse<PurchaseQuotation>>('/purchase-quotations', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseQuotationKeys.lists() });
    },
  });
}

export function useUpdatePurchaseQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: PurchaseQuotationInput }) => {
      const { data } = await api.put<ApiResponse<PurchaseQuotation>>(`/purchase-quotations/${id}`, payload);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseQuotationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseQuotationKeys.detail(data.ID) });
    },
  });
}

export function useDeletePurchaseQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/purchase-quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseQuotationKeys.lists() });
    },
  });
}
