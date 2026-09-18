import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

/* =========================================================================
 * TYPES & INTERFACES
 * ========================================================================= */

export interface BankingAccount {
  id: number;
  account_name: string;
  gl_account_code: string;
  current_balance: number;
  authorized_limit: number;
  currency: string;
  is_active?: boolean;
}

export interface BankingOverview {
  totalIncomingAllTime: number;
  totalIncomingThisMonth: number;
  incomingCount: number;
  totalOutgoingAllTime: number;
  totalOutgoingThisMonth: number;
  outgoingCount: number;
  netCashFlow: number;
  totalPettyCashBalance: number;
  totalPettyCashAuthorized: number;
  pettyAccountsCount: number;
  totalPendingPoLiability: number;
  pendingPoCount: number;
  recentTransactions: Array<{
    id: string;
    doc_number: string;
    party: string;
    party_code: string;
    type: 'incoming' | 'outgoing';
    payment_type: string;
    amount: number;
    currency: string;
    date: string | null;
    status: string;
  }>;
  accounts: BankingAccount[];
}

export interface IncomingPaymentInvoice {
  id?: number;
  parent_id?: number;
  ar_invoice_id: number;
  applied_amount: number;
  discount_amount?: number;
  total_payment: number;
  invoice_date?: string | null;
  balance_due?: number;
  total_received?: number;
}

export interface IncomingPaymentMeans {
  id?: number;
  parent_id?: number;
  means_type: string;
  gl_account: string;
  amount: number;
  transfer_date?: string | null;
  reference_num?: string | null;
  check_bank_code?: string | null;
  cc_name?: string | null;
  is_cleared?: boolean;
}

export interface IncomingPayment {
  id: number;
  doc_number: string;
  customer_code: string;
  customer_name?: string;
  customer_address?: string | null;
  customer_mobile?: string | null;
  payment_type?: string | null;
  posting_date?: string | null;
  document_date?: string | null;
  reference_number?: string | null;
  journal_remarks?: string | null;
  total_amount: number;
  exchange_rate?: number | null;
  currency?: string | null;
  status?: string | null;
  created_by?: number | null;
  created_by_name?: string | null;
  created_on?: string | null;
  invoices_count?: number;
  means_count?: number;
  primary_means?: string;
  incoming_payment_invoices?: IncomingPaymentInvoice[];
  incoming_payment_means?: IncomingPaymentMeans[];
}

export interface OutgoingPaymentInvoice {
  id?: number;
  parent_id?: number;
  ap_invoice_id: string;
  applied_amount: number;
  discount_amount?: number;
  total_payment: number;
  invice_date?: string | null;
  total_amount?: number;
  balance_due?: number;
  payment_amount?: number;
}

export interface OutgoingPaymentMeans {
  id?: number;
  parent_id?: number;
  means_type: string;
  gl_account: string;
  amount: number;
  transfer_date?: string | null;
  reference_num?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  check_number?: string | null;
  check_date?: string | null;
  is_cleared?: boolean;
}

export interface OutgoingPayment {
  id: number;
  doc_number: string;
  vendor_code: string;
  vendor_name?: string;
  base_request_id?: number | null;
  payment_type?: string | null;
  posting_date?: string | null;
  document_date?: string | null;
  reference_number?: string | null;
  journal_remarks?: string | null;
  total_amount: number;
  currency?: string | null;
  status?: string | null;
  project_code?: string | null;
  cost_center?: string | null;
  created_by?: number | null;
  created_by_name?: string | null;
  created_on?: string | null;
  invoices_count?: number;
  means_count?: number;
  primary_means?: string;
  bank_account?: string | null;
  outgoing_payment_invoices?: OutgoingPaymentInvoice[];
  outgoing_payment_means?: OutgoingPaymentMeans[];
}

export interface PettyCashAccount {
  id: number;
  account_name: string;
  gl_account_code: string;
  custodian_user_id: number;
  custodian_name?: string;
  authorized_limit: number;
  current_balance: number;
  currency: string;
  is_active?: boolean;
  last_replenished_date?: string | null;
}

export interface PettyCashLine {
  id?: number;
  parent_id?: number;
  expense_gl_account: string;
  description: string;
  amount: number;
  has_receipt_attachment?: boolean;
  receipt_file_path?: string | null;
}

export interface PettyCashClaim {
  id: number;
  claim_number: string;
  requester_user_id: number;
  requester_name?: string;
  requester_email?: string | null;
  department?: string | null;
  request_date?: string | null;
  total_requested: number;
  category?: string | null;
  currency?: string | null;
  status?: string | null;
  manager_approval_notes?: string | null;
  disbursed_from_account_id?: number | null;
  disbursed_date?: string | null;
  account_name?: string | null;
  lines_count?: number;
  created_on?: string | null;
  petty_cash_lines?: PettyCashLine[];
}

export interface PendingPoPayment {
  id: number;
  parent_id: number;
  request_id?: number | null;
  request_no: string;
  po_id?: number | null;
  po_total?: number | null;
  advance_amount: number;
  balance: number;
  priority: string;
  funds_required_by?: string | null;
  justification?: string | null;
  status: string;
  created_at?: string | null;
}

/* =========================================================================
 * HOOKS
 * ========================================================================= */

/** 1. Overview */
export const useBankingOverview = () => {
  return useQuery({
    queryKey: ['banking-overview'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: BankingOverview }>('/banking/overview');
      return res.data.data;
    },
  });
};

/** 2. Incoming Payments */
export const useIncomingPayments = (filters?: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['incoming-payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const res = await api.get<{ success: boolean; data: IncomingPayment[] }>(`/banking/incoming?${params.toString()}`);
      return res.data.data;
    },
  });
};

export const useIncomingPayment = (id: number | null) => {
  return useQuery({
    queryKey: ['incoming-payment', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ success: boolean; data: IncomingPayment }>(`/banking/incoming/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useAvailableInvoices = (customerCode?: string) => {
  return useQuery({
    queryKey: ['available-invoices', customerCode],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (customerCode) params.append('customerCode', customerCode);
      const res = await api.get<{ success: boolean; data: any[] }>(`/banking/incoming/available-invoices?${params.toString()}`);
      return res.data.data;
    },
  });
};

export const useCreateIncomingPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post<{ success: boolean; data: IncomingPayment }>('/banking/incoming', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-payments'] });
      queryClient.invalidateQueries({ queryKey: ['banking-overview'] });
      queryClient.invalidateQueries({ queryKey: ['ar-invoices'] });
    },
  });
};

export const useDeleteIncomingPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/banking/incoming/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-payments'] });
      queryClient.invalidateQueries({ queryKey: ['banking-overview'] });
    },
  });
};

/** 3. Outgoing Payments */
export const useOutgoingPayments = (filters?: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['outgoing-payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const res = await api.get<{ success: boolean; data: OutgoingPayment[] }>(`/banking/outgoing?${params.toString()}`);
      return res.data.data;
    },
  });
};

export const useOutgoingPayment = (id: number | null) => {
  return useQuery({
    queryKey: ['outgoing-payment', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ success: boolean; data: OutgoingPayment }>(`/banking/outgoing/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateOutgoingPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post<{ success: boolean; data: OutgoingPayment }>('/banking/outgoing', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outgoing-payments'] });
      queryClient.invalidateQueries({ queryKey: ['banking-overview'] });
    },
  });
};

export const useDeleteOutgoingPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/banking/outgoing/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outgoing-payments'] });
      queryClient.invalidateQueries({ queryKey: ['banking-overview'] });
    },
  });
};

/** 4. Petty Cash */
export const usePettyCashAccounts = () => {
  return useQuery({
    queryKey: ['petty-cash-accounts'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: PettyCashAccount[] }>('/banking/petty-cash/accounts');
      return res.data.data;
    },
  });
};

export const usePettyCashClaims = (filters?: {
  search?: string;
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['petty-cash-claims', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const res = await api.get<{ success: boolean; data: PettyCashClaim[] }>(`/banking/petty-cash/claims?${params.toString()}`);
      return res.data.data;
    },
  });
};

export const usePettyCashClaim = (id: number | null) => {
  return useQuery({
    queryKey: ['petty-cash-claim', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<{ success: boolean; data: PettyCashClaim }>(`/banking/petty-cash/claims/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useCreatePettyCashClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post<{ success: boolean; data: PettyCashClaim }>('/banking/petty-cash/claims', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petty-cash-claims'] });
      queryClient.invalidateQueries({ queryKey: ['banking-overview'] });
    },
  });
};

export const useDisbursePettyCashClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accountId }: { id: number; accountId: number }) => {
      const res = await api.post<{ success: boolean; data: PettyCashClaim }>(`/banking/petty-cash/claims/${id}/disburse`, { accountId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petty-cash-claims'] });
      queryClient.invalidateQueries({ queryKey: ['petty-cash-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['banking-overview'] });
    },
  });
};

/** 5. Pending PO Payments */
export const usePendingPoPayments = (filters?: { search?: string; status?: string }) => {
  return useQuery({
    queryKey: ['pending-po-payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);

      const res = await api.get<{ success: boolean; data: PendingPoPayment[] }>(`/banking/pending-po?${params.toString()}`);
      return res.data.data;
    },
  });
};
