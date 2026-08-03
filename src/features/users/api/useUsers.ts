import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  code: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  mobileNo: string | null;
  gender: string | null;
  dob: string | null;
  address: string | null;
  department: string | null;
  isAdmin: boolean;
  active: boolean;
  profileImg: string | null;
  branchId: number | null;
  maxDiscount: number | null;
  isAllowLineDiscount: boolean;
  isPriceEdit: boolean;
  isFrieghtAdd: boolean;
  role: 'admin' | 'user';
  createdAt: string | null;
  project: string | null;
  dfltWhsId: number | null;
  route: string | null;
  dim1: string | null;
  dim2: string | null;
  dim3: string | null;
  dim4: string | null;
  cashAcct: string | null;
  checkAcct: string | null;
  tigoPesa: string | null;
  mpesa: string | null;
  airtelMoney: string | null;
  bankDeposit: string | null;
  userPermission: string | null;
}

export interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: 'Y' | 'N' | 'all';
}

export interface UsersResponse {
  status: string;
  users: ApiUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  };
}

export interface UpdateUserPayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  mobileNo?: string;
  gender?: string;
  dob?: string;
  address?: string;
  department?: string;
  active?: boolean;
  isAdmin?: boolean;
  branchId?: number | null;
  project?: string | null;
  dfltWhsId?: number | null;
  route?: string | null;
  maxDiscount?: number | null;
  isPriceEdit?: boolean;
  isAllowLineDiscount?: boolean;
  isFrieghtAdd?: boolean;
  dim1?: string | null;
  dim2?: string | null;
  dim3?: string | null;
  dim4?: string | null;
  cashAcct?: string | null;
  checkAcct?: string | null;
  tigoPesa?: string | null;
  mpesa?: string | null;
  airtelMoney?: string | null;
  bankDeposit?: string | null;
  userPermission?: string | null;
}

// ─── API base URL helper ──────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

export function getUserAvatarUrl(profileImg: string | null | undefined): string {
  if (!profileImg) return '';
  if (profileImg.startsWith('http')) return profileImg;
  return `https://imperial_api.dccsalesapp.com/sales_app_api_ipl/public//images/users/${profileImg.replace(/^\/+/, '')}`;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** List users with pagination, search, and active filter */
export function useUsers(params: UsersParams = {}) {
  return useQuery<UsersResponse>({
    queryKey: ['users', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', String(params.page));
      if (params.limit) queryParams.set('limit', String(params.limit));
      if (params.search) queryParams.set('search', params.search);
      if (params.active) queryParams.set('active', params.active);

      const { data } = await api.get<UsersResponse>(`/users?${queryParams}`);
      return data;
    },
    staleTime: 30_000,
  });
}

/** Get a single user by ID */
export function useUser(id: number | null) {
  return useQuery<{ status: string; data: { user: ApiUser } }>({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/** Update a user's profile */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UpdateUserPayload }) => {
      const { data } = await api.put<{ status: string; data: { user: ApiUser } }>(
        `/users/${id}`,
        payload
      );
      return data.data.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/** Upload a user's profile avatar */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const form = new FormData();
      form.append('avatar', file);
      const { data } = await api.post<{
        status: string;
        data: { user: ApiUser; avatarPath: string };
      }>(`/users/${id}/avatar`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
