import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface PurchaseRequestItem {
  ID?: number;
  LineNum: number;
  ItemID: number;
  ItemCode?: string | null;
  ItemName?: string | null;
  LineStatus: string;
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
  LineTotalFC?: number | null;
  LineTotalSC?: number | null;
  cost_center?: number | null;
  project?: string | null;
  Remarks?: string | null;
  CGuid?: string;
  UoM?: string | null;
}

export interface PurchaseRequestAttachment {
  ID?: number;
  LineNum: number;
  Attachment: string;
  CGuid?: string;
}

export interface PurchaseRequest {
  ID: number;
  CustCode: string;
  CustName: string | null;
  Address: string | null;
  CustRefNo: string | null;
  ContPerson: number | null;
  Currency: string | null;
  CurRate: number | null;
  PostDate: string | null;
  DueDate: string | null;
  TypeRequest: string;
  ActivityName: string | null;
  ActivityCode: string | null;
  RequestedByDate: string | null;
  RequestedNo: string | null;
  Image1: string | null;
  Image2: string | null;
  Image3: string | null;
  DiscPrcnt: number | null;
  TaxTotal: number | null;
  DocTotal: number | null;
  DocTotalFC: number | null;
  DocTotalSC: number | null;
  SourceSeries: number | null;
  BOL: string | null;
  SourceDocId: string | null;
  SourceDocType: string | null;
  SourceSystem: string | null;
  UserId: number | null;
  OwnerCode: number | null;
  Rounding: string | null;
  RoundingAmnt: number | null;
  Remarks: string | null;
  ShiptoID: string | null;
  BilltoID: string | null;
  Status: string;
  CreatedDate: string;
  CGuid: string;
  DueDateString: string | null;
  SalesType: number | null;
  SAPDocEntry: number | null;
  TotalBefDisc: number | null;
  AprStatus: string;
  AprBy: string | null;
  AprDate: string | null;
  AprRemark: string | null;
  CreatedBy: number | null;
  UpdatedBy: number | null;
  UpdatedDate: string | null;
  DMLFlag: number | null;
  OrderCode: string | null;
  Branch_id: number | null;
  RequestType: string | null;
  PO_ID: string | null;
  PO_Qty: string | null;
  DocName: string | null;
  PaymentMethod: string | null;
  series: string | null;
  SAPDocNum: string | null;
  Freight: number | null;
  Expense_type: string | null;
  memo_text: string | null;
  Ufs: string | null;
  Department: string | null;
  SapStatus: string;
  items?: PurchaseRequestItem[];
  attachments?: PurchaseRequestAttachment[];
}

export interface PurchaseRequestInput {
  CustCode: string;
  CustName?: string | null;
  Address?: string | null;
  CustRefNo?: string | null;
  Currency?: string | null;
  CurRate?: number | null;
  PostDate?: string | null;
  DueDate?: string | null;
  TypeRequest: string;
  RequestedByDate?: string | null;
  Remarks?: string | null;
  Branch_id?: number | null;
  RequestType?: string | null;
  Expense_type?: string | null;
  memo_text?: string | null;
  Department?: string | null;
  items: PurchaseRequestItem[];
}

export const purchaseRequestKeys = {
  all: ['purchase-requests'] as const,
  lists: () => [...purchaseRequestKeys.all, 'list'] as const,
  list: (filters: any) => [...purchaseRequestKeys.lists(), filters] as const,
  details: () => [...purchaseRequestKeys.all, 'detail'] as const,
  detail: (id: number) => [...purchaseRequestKeys.details(), id] as const,
};

interface ApiResponse<T> {
  status: string;
  data: T;
}

export function usePurchaseRequests(filters: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  branchId?: number;
  typeRequest?: string;
} = {}) {
  return useQuery({
    queryKey: purchaseRequestKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PurchaseRequest[]>>('/purchase-requests', {
        params: filters,
      });
      return data.data || [];
    },
  });
}

export function usePurchaseRequest(id: number | null) {
  return useQuery({
    queryKey: purchaseRequestKeys.detail(id || 0),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PurchaseRequestInput) => {
      const { data } = await api.post<ApiResponse<PurchaseRequest>>('/purchase-requests', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
    },
  });
}

export function useUpdatePurchaseRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: PurchaseRequestInput }) => {
      const { data } = await api.put<ApiResponse<PurchaseRequest>>(`/purchase-requests/${id}`, payload);
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.detail(data.ID) });
    },
  });
}

export function useDeletePurchaseRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/purchase-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseRequestKeys.lists() });
    },
  });
}
