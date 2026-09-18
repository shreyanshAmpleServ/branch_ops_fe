import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../lib/api';

export interface ApInvoiceItem {
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

export interface ApInvoiceAttachment {
  ID?: number;
  LineNum: number;
  Attachment: string;
  CGuid?: string;
}

export interface ApInvoice {
  ID: number;
  CustCode: string;
  CustName: string | null;
  Address?: string | null;
  CustRefNo?: string | null;
  Currency?: string | null;
  CurRate?: number | string | null;
  PostDate: string | null;
  DueDate?: string | null;
  PODate?: string | null;
  DeliveryDate?: string | null;
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
  AprStatus?: string | null;
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
  CreatedByName?: string | null;
  items?: ApInvoiceItem[];
  attachments?: ApInvoiceAttachment[];
}

export interface ApInvoiceInput {
  CustCode: string;
  CustName?: string | null;
  Address?: string | null;
  CustRefNo?: string | null;
  Currency?: string | null;
  CurRate?: number | null;
  PostDate?: string;
  DueDate?: string;
  PODate?: string;
  DeliveryDate?: string;
  Remarks?: string | null;
  Branch_id?: number | null;
  OrderCode?: string;
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
  items: ApInvoiceItem[];
  attachments?: { LineNum: number; Attachment: string }[];
}

export interface ApInvoicesResponse {
  status: string;
  data: ApInvoice[];
}

export interface ApInvoiceResponse {
  status: string;
  data: ApInvoice;
}

export interface ApInvoiceFilters {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  branchId?: number;
  typeRequest?: string;
}

export function useApInvoices(filters?: ApInvoiceFilters) {
  return useQuery<ApInvoice[]>({
    queryKey: ['ap-invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.branchId) params.append('branchId', filters.branchId.toString());
      if (filters?.typeRequest) params.append('typeRequest', filters.typeRequest);

      const res = await api.get<ApInvoicesResponse>(`/ap-invoice?${params.toString()}`);
      return res.data?.data || [];
    },
    staleTime: 60 * 1000,
  });
}

export function useApInvoice(id: number | null) {
  return useQuery<ApInvoice>({
    queryKey: ['ap-invoice', id],
    queryFn: async () => {
      if (!id) throw new Error('AP Invoice ID is required');
      const res = await api.get<ApInvoiceResponse>(`/ap-invoice/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });
}

export function useCreateApInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ApInvoiceInput) => {
      const res = await api.post<ApInvoiceResponse>('/ap-invoice', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ap-invoices'] });
    },
  });
}

export function useUpdateApInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ApInvoiceInput }) => {
      const res = await api.put<ApInvoiceResponse>(`/ap-invoice/${id}`, payload);
      return res.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ap-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['ap-invoice', variables.id] });
    },
  });
}

export function useDeleteApInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/ap-invoice/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ap-invoices'] });
    },
  });
}
