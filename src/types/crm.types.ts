export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'prospect';
  source: 'website' | 'referral' | 'social' | 'email' | 'cold_call' | 'other';
  tags: string[];
  notes?: string;
  address?: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface Lead {
  id: string;
  title: string;
  contactId: string;
  contact?: Contact;
  value: number;
  currency: string;
  stage: LeadStage;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  assignedTo: string;
  expectedCloseDate: string;
  notes?: string;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  title: string;
  contactId: string;
  contact?: Contact;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  assignedTo: string;
  expectedCloseDate: string;
  actualCloseDate?: string;
  products: string[];
  notes?: string;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export type DealStage = 'discovery' | 'proposal' | 'negotiation' | 'contract' | 'closed_won' | 'closed_lost';

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  relatedTo?: { type: 'contact' | 'lead' | 'deal'; id: string };
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  completedAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description?: string;
  date: string;
  userId: string;
}

export interface DashboardStats {
  totalContacts: number;
  totalLeads: number;
  totalDeals: number;
  totalRevenue: number;
  conversionRate: number;
  openTasks: number;
  revenueByMonth: { month: string; revenue: number }[];
  leadsByStage: { stage: string; count: number }[];
  dealsByStage: { stage: string; count: number; value: number }[];
  recentActivities: Activity[];
  topPerformers: { name: string; deals: number; revenue: number }[];
}

export interface PipelineColumn {
  id: string;
  title: string;
  items: (Lead | Deal)[];
  color: string;
}
