import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../lib/api';

export interface PurchaseOrderItem {
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
  Location?: string | null;
}

export interface PurchaseOrderAttachment {
  ID?: number;
  LineNum: number;
  Attachment: string;
  CGuid?: string;
}

export interface PurchaseOrder {
  ID: number;
  CustCode: string;
  CustName: string | null;
  Address?: string | null;
  CustRefNo?: string | null;
  ContPerson?: number | null;
  Currency?: string | null;
  CurRate?: number | string | null;
  PostDate: string | null;
  DueDate?: string | null;
  ReceiptDate?: string | null;
  PODate?: string | null;
  TaxDate?: string | null;
  DiscPrcnt: number | string | null;
  TaxTotal: number | string | null;
  DocTotal: number | string | null;
  DocTotalFC?: number | string | null;
  DocTotalSC?: number | string | null;
  Rounding?: string | null;
  RoundingAmnt?: number | string | null;
  Freight?: number | string | null;
  Remarks: string | null;
  Status: string;
  CreatedDate: string;
  CGuid: string;
  DueDateString?: string | null;
  TotalBefDisc: number | string | null;
  AprStatus: string;
  AprBy?: string | number | null;
  AprDate?: string | null;
  AprRemark?: string | null;
  CreatedBy?: number | null;
  UpdatedBy?: number | null;
  UpdatedDate?: string | null;
  Branch_id?: number | null;
  OrderCode?: string | null;
  RequestedNo?: string | null;
  relation_from?: string | null;
  SAPDocNum?: string | number | null;
  Department?: string | null;
  ExpenseType?: string | null;
  Expense_type?: string | null;
  RequestType?: string | null;
  TypeRequest?: string | null;
  TypePayment?: string | null;
  Pr_ID?: string | number | null;
  Pq_ID?: string | number | null;
  PurchaseRequestId?: number | null;
  PurchaseQuotationId?: number | null;
  CreatedByName?: string | null;
  items?: PurchaseOrderItem[];
  attachments?: PurchaseOrderAttachment[];
}

export interface PurchaseOrderInput {
  CustCode: string;
  CustName?: string | null;
  Address?: string | null;
  CustRefNo?: string | null;
  Currency?: string | null;
  CurRate?: number | null;
  PostDate?: string | null;
  DueDate?: string | null;
  ReceiptDate?: string | null;
  PODate?: string | null;
  TaxDate?: string | null;
  Remarks?: string | null;
  Branch_id?: number | null;
  OrderCode?: string | null;
  RequestedNo?: string | null;
  relation_from?: string | null;
  DiscPrcnt?: number | null;
  Rounding?: string | null;
  RoundingAmnt?: number | null;
  Freight?: number | null;
  Department?: string | null;
  ExpenseType?: string | null;
  Expense_type?: string | null;
  RequestType?: string | null;
  TypeRequest?: string | null;
  TypePayment?: string | null;
  Pr_ID?: string | number | null;
  Pq_ID?: string | number | null;
  PurchaseRequestId?: number | null;
  PurchaseQuotationId?: number | null;
  items: PurchaseOrderItem[];
  attachments?: { LineNum?: number; Attachment: string }[];
}

export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (filters: any) => [...purchaseOrderKeys.lists(), filters] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: number) => [...purchaseOrderKeys.details(), id] as const,
};

interface ApiResponse<T> {
  status: string;
  data: T;
}

export function usePurchaseOrders(filters: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  branchId?: number;
} = {}) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PurchaseOrder[]>>('/purchase-orders', {
        params: filters,
      });
      return data.data || [];
    },
  });
}

export function usePurchaseOrder(id: number | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id || 0),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PurchaseOrderInput) => {
      const { data } = await api.post<ApiResponse<PurchaseOrder>>('/purchase-orders', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: PurchaseOrderInput }) => {
      const { data } = await api.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, payload);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(data.ID) });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}
