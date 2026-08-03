import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import type { Contact } from '../../../types/crm.types';

export const contactsKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactsKeys.all, 'list'] as const,
  list: (filters: string) => [...contactsKeys.lists(), { filters }] as const,
  details: () => [...contactsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactsKeys.details(), id] as const,
};

// Types corresponding to backend responses
interface GetContactsResponse {
  status: string;
  results: number;
  data: {
    contacts: Contact[];
  };
}

interface ContactResponse {
  status: string;
  data: {
    contact: Contact;
  };
}

export const useContacts = () => {
  return useQuery({
    queryKey: contactsKeys.lists(),
    queryFn: async () => {
      const { data } = await api.get<GetContactsResponse>('/customers');
      return data.data.contacts;
    },
  });
};

export const useContact = (id: string) => {
  return useQuery({
    queryKey: contactsKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ContactResponse>(`/customers/${id}`);
      return data.data.contact;
    },
    enabled: !!id,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newContact: Partial<Contact>) => {
      const { data } = await api.post<ContactResponse>('/customers', newContact);
      return data.data.contact;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
      const { data: response } = await api.put<ContactResponse>(`/customers/${id}`, data);
      return response.data.contact;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactsKeys.detail(data.id) });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.lists() });
    },
  });
};
