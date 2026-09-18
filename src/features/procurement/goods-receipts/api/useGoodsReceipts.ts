import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../lib/api';

export interface GoodsReceiptItem {
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
  mainCguid?: string;
  UoM?: string | null;
  vendor?: string | null;
  DIM1?: string | null;
  DIM2?: string | null;
  DIM3?: string | null;
  DIM4?: string | null;
  DIM5?: string | null;
  ferightType?: string | null;
  vendorRef?: string | null;
  SourceDocId?: string | null;
  SourceLineNum?: number | null;
  SourceDocType?: string | null;
  Location?: string | null;
}

export interface GoodsReceiptAttachment {
  ID?: number;
  LineNum: number;
  Attachment: string;
  CGuid?: string;
}

export interface GoodsReceipt {
  ID: number;
  CustCode: string;
  CustName: string | null;
  Address?: string | null;
  CustRefNo?: string | null;
  Currency?: string | null;
  CurRate?: number | string | null;
  PostDate: string | null;
  DeliveryDate?: string | null;
  PODate?: string | null;
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
  purchaseOrder?: string | null;
  relation_from?: string | null;
  SAPDocNum?: string | number | null;
  Department?: string | null;
  ExpenseType?: string | null;
  RequestType?: string | null;
  TypeRequest?: string | null;
  TypePayment?: string | null;
  PurchaseOrderId?: number | null;
  CreatedByName?: string | null;
  items?: GoodsReceiptItem[];
  attachments?: GoodsReceiptAttachment[];
}

export interface GoodsReceiptInput {
  CustCode: string;
  CustName?: string | null;
  Address?: string | null;
  CustRefNo?: string | null;
  Currency?: string | null;
  CurRate?: number | null;
  PostDate?: string | null;
  DeliveryDate?: string | null;
  PODate?: string | null;
  Remarks?: string | null;
  Branch_id?: number | null;
  OrderCode?: string | null;
  RequestedNo?: string | null;
  purchaseOrder?: string | null;
  relation_from?: string | null;
  DiscPrcnt?: number | null;
  Rounding?: string | null;
  RoundingAmnt?: number | null;
  Freight?: number | null;
  Department?: string | null;
  ExpenseType?: string | null;
  RequestType?: string | null;
  TypeRequest?: string | null;
  TypePayment?: string | null;
  PurchaseOrderId?: number | null;
  items: GoodsReceiptItem[];
  attachments?: { LineNum?: number; Attachment: string }[];
}

export const goodsReceiptKeys = {
  all: ['goods-receipts'] as const,
  lists: () => [...goodsReceiptKeys.all, 'list'] as const,
  list: (filters: any) => [...goodsReceiptKeys.lists(), filters] as const,
  details: () => [...goodsReceiptKeys.all, 'detail'] as const,
  detail: (id: number) => [...goodsReceiptKeys.details(), id] as const,
};

interface ApiResponse<T> {
  status: string;
  data: T;
}

export function useGoodsReceipts(filters: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  branchId?: number;
} = {}) {
  return useQuery({
    queryKey: goodsReceiptKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GoodsReceipt[]>>('/goods-receipts', {
        params: filters,
      });
      return data.data || [];
    },
  });
}

export function useGoodsReceipt(id: number | null) {
  return useQuery({
    queryKey: goodsReceiptKeys.detail(id || 0),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GoodsReceipt>>(`/goods-receipts/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: GoodsReceiptInput) => {
      const { data } = await api.post<ApiResponse<GoodsReceipt>>('/goods-receipts', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
    },
  });
}

export function useUpdateGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: GoodsReceiptInput }) => {
      const { data } = await api.put<ApiResponse<GoodsReceipt>>(`/goods-receipts/${id}`, payload);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.detail(data.ID) });
    },
  });
}

export function useDeleteGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/goods-receipts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
    },
  });
}
