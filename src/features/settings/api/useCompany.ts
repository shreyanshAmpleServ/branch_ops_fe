import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface CompanyDetail {
  companyName: string;
  companyAddr: string | null;
  printHeader: string | null;
  phone1: string | null;
  phone2: string | null;
  fax: string | null;
  email: string | null;
  localCur: string | null;
  systemCur: string | null;
  tin: string | null;
  vrn: string | null;
  smtpEmail: string | null;
  smtpPassword: string | null;
  smtpServer: string | null;
  smtpPort: string | null;
  smtpType: string | null;
  headerColor: string | null;
  leftMenuColor: string | null;
  compUrl: string | null;
  compLogo: string | null;
}

interface GenericResponse<T> {
  status: string;
  data: T;
}

export function useCompanyDetails() {
  return useQuery<GenericResponse<CompanyDetail>>({
    queryKey: ['company-details'],
    queryFn: async () => {
      const { data } = await api.get<GenericResponse<CompanyDetail>>('/company');
      return data;
    },
  });
}

export function useUpdateCompanyDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CompanyDetail>) => {
      const { data } = await api.put<GenericResponse<CompanyDetail>>('/company', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-details'] });
    },
  });
}
