import type { Contact, Lead, Deal, Task, DashboardStats } from '../types/crm.types';

export const MOCK_CONTACTS: Contact[] = [
  { id: '1', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@techcorp.com', phone: '+1 (555) 123-4567', company: 'TechCorp Inc', position: 'CTO', status: 'active', source: 'referral', tags: ['enterprise', 'tech'], createdAt: '2024-12-15T10:30:00Z', updatedAt: '2025-06-20T14:00:00Z' },
  { id: '2', firstName: 'Michael', lastName: 'Chen', email: 'mchen@innovate.io', phone: '+1 (555) 234-5678', company: 'Innovate.io', position: 'VP Engineering', status: 'active', source: 'website', tags: ['startup', 'ai'], createdAt: '2025-01-10T09:15:00Z', updatedAt: '2025-07-01T11:00:00Z' },
  { id: '3', firstName: 'Priya', lastName: 'Sharma', email: 'priya@globalsoft.in', phone: '+91 98765 43210', company: 'GlobalSoft', position: 'Head of Product', status: 'prospect', source: 'social', tags: ['saas', 'india'], createdAt: '2025-02-20T16:45:00Z', updatedAt: '2025-06-25T09:30:00Z' },
  { id: '4', firstName: 'James', lastName: 'Wilson', email: 'jwilson@retail.com', phone: '+1 (555) 345-6789', company: 'RetailMax', position: 'Director of IT', status: 'active', source: 'cold_call', tags: ['retail', 'enterprise'], createdAt: '2025-03-05T11:00:00Z', updatedAt: '2025-07-03T15:20:00Z' },
  { id: '5', firstName: 'Aisha', lastName: 'Al-Rashid', email: 'aisha@fintech.ae', phone: '+971 50 123 4567', company: 'FinTech Gulf', position: 'CEO', status: 'active', source: 'referral', tags: ['fintech', 'dubai'], createdAt: '2025-03-15T08:00:00Z', updatedAt: '2025-07-05T12:00:00Z' },
  { id: '6', firstName: 'David', lastName: 'Park', email: 'dpark@cloudnine.tech', phone: '+1 (555) 456-7890', company: 'CloudNine Tech', position: 'COO', status: 'inactive', source: 'email', tags: ['cloud'], createdAt: '2025-04-01T14:30:00Z', updatedAt: '2025-06-10T10:00:00Z' },
  { id: '7', firstName: 'Emma', lastName: 'Martinez', email: 'emma@designhub.co', phone: '+1 (555) 567-8901', company: 'DesignHub', position: 'Creative Director', status: 'active', source: 'website', tags: ['design', 'agency'], createdAt: '2025-04-20T09:45:00Z', updatedAt: '2025-07-04T16:00:00Z' },
  { id: '8', firstName: 'Raj', lastName: 'Patel', email: 'raj@datacore.com', phone: '+91 88888 99999', company: 'DataCore Analytics', position: 'Data Scientist', status: 'prospect', source: 'social', tags: ['analytics', 'ml'], createdAt: '2025-05-10T12:15:00Z', updatedAt: '2025-07-06T08:30:00Z' },
  { id: '9', firstName: 'Lisa', lastName: 'Thompson', email: 'lisa@healthtech.com', phone: '+1 (555) 678-9012', company: 'HealthTech Solutions', position: 'VP Operations', status: 'active', source: 'referral', tags: ['healthcare'], createdAt: '2025-05-25T11:00:00Z', updatedAt: '2025-07-07T14:00:00Z' },
  { id: '10', firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed@smartlogistics.com', phone: '+20 100 123 4567', company: 'Smart Logistics', position: 'Founder', status: 'active', source: 'cold_call', tags: ['logistics', 'startup'], createdAt: '2025-06-01T10:00:00Z', updatedAt: '2025-07-08T09:00:00Z' },
  { id: '11', firstName: 'Yuki', lastName: 'Tanaka', email: 'yuki@nexgen.jp', phone: '+81 3 1234 5678', company: 'NexGen Japan', position: 'Engineering Manager', status: 'active', source: 'website', tags: ['robotics'], createdAt: '2025-06-15T07:30:00Z', updatedAt: '2025-07-08T11:00:00Z' },
  { id: '12', firstName: 'Carlos', lastName: 'Rodriguez', email: 'carlos@latamtech.com', phone: '+52 55 1234 5678', company: 'LatAm Tech', position: 'Regional Director', status: 'prospect', source: 'email', tags: ['latam'], createdAt: '2025-06-28T15:00:00Z', updatedAt: '2025-07-09T10:00:00Z' },
];

export const MOCK_LEADS: Lead[] = [
  { id: '1', title: 'Enterprise Cloud Migration', contactId: '1', value: 125000, currency: 'USD', stage: 'qualified', priority: 'high', source: 'referral', assignedTo: 'Admin User', expectedCloseDate: '2026-08-15', activities: [], createdAt: '2025-06-01T10:00:00Z', updatedAt: '2025-07-08T12:00:00Z' },
  { id: '2', title: 'AI Platform License', contactId: '2', value: 85000, currency: 'USD', stage: 'proposal', priority: 'high', source: 'website', assignedTo: 'Manager User', expectedCloseDate: '2026-07-30', activities: [], createdAt: '2025-06-10T09:00:00Z', updatedAt: '2025-07-07T15:00:00Z' },
  { id: '3', title: 'SaaS Integration Package', contactId: '3', value: 45000, currency: 'INR', stage: 'new', priority: 'medium', source: 'social', assignedTo: 'Admin User', expectedCloseDate: '2026-09-01', activities: [], createdAt: '2025-06-20T14:30:00Z', updatedAt: '2025-07-06T11:00:00Z' },
  { id: '4', title: 'Retail POS System', contactId: '4', value: 200000, currency: 'USD', stage: 'negotiation', priority: 'urgent', source: 'cold_call', assignedTo: 'Manager User', expectedCloseDate: '2026-07-20', activities: [], createdAt: '2025-05-15T11:00:00Z', updatedAt: '2025-07-09T09:00:00Z' },
  { id: '5', title: 'Digital Banking Suite', contactId: '5', value: 350000, currency: 'AED', stage: 'contacted', priority: 'high', source: 'referral', assignedTo: 'Admin User', expectedCloseDate: '2026-10-01', activities: [], createdAt: '2025-06-25T08:00:00Z', updatedAt: '2025-07-08T16:00:00Z' },
  { id: '6', title: 'Cloud Infrastructure', contactId: '6', value: 75000, currency: 'USD', stage: 'won', priority: 'medium', source: 'email', assignedTo: 'Regular User', expectedCloseDate: '2026-06-30', activities: [], createdAt: '2025-04-10T09:00:00Z', updatedAt: '2025-06-30T14:00:00Z' },
  { id: '7', title: 'Design System License', contactId: '7', value: 30000, currency: 'USD', stage: 'qualified', priority: 'low', source: 'website', assignedTo: 'Admin User', expectedCloseDate: '2026-08-30', activities: [], createdAt: '2025-06-30T16:00:00Z', updatedAt: '2025-07-09T10:00:00Z' },
  { id: '8', title: 'Analytics Dashboard', contactId: '8', value: 60000, currency: 'INR', stage: 'proposal', priority: 'medium', source: 'social', assignedTo: 'Manager User', expectedCloseDate: '2026-09-15', activities: [], createdAt: '2025-07-01T10:00:00Z', updatedAt: '2025-07-08T13:00:00Z' },
];

export const MOCK_DEALS: Deal[] = [
  { id: '1', title: 'TechCorp Cloud Contract', contactId: '1', value: 125000, currency: 'USD', stage: 'contract', probability: 85, assignedTo: 'Admin User', expectedCloseDate: '2026-08-01', products: ['Cloud Pro', 'Support'], activities: [], createdAt: '2025-05-01T10:00:00Z', updatedAt: '2025-07-08T12:00:00Z' },
  { id: '2', title: 'Innovate.io AI Deal', contactId: '2', value: 85000, currency: 'USD', stage: 'negotiation', probability: 60, assignedTo: 'Manager User', expectedCloseDate: '2026-07-25', products: ['AI Platform'], activities: [], createdAt: '2025-05-15T09:00:00Z', updatedAt: '2025-07-07T16:00:00Z' },
  { id: '3', title: 'RetailMax POS', contactId: '4', value: 200000, currency: 'USD', stage: 'proposal', probability: 45, assignedTo: 'Manager User', expectedCloseDate: '2026-08-15', products: ['POS Pro', 'Inventory'], activities: [], createdAt: '2025-06-01T11:00:00Z', updatedAt: '2025-07-09T09:00:00Z' },
  { id: '4', title: 'FinTech Gulf Banking', contactId: '5', value: 350000, currency: 'AED', stage: 'discovery', probability: 25, assignedTo: 'Admin User', expectedCloseDate: '2026-10-01', products: ['Banking Suite'], activities: [], createdAt: '2025-06-20T08:00:00Z', updatedAt: '2025-07-08T14:00:00Z' },
  { id: '5', title: 'CloudNine Infra', contactId: '6', value: 75000, currency: 'USD', stage: 'closed_won', probability: 100, assignedTo: 'Regular User', expectedCloseDate: '2026-06-30', actualCloseDate: '2026-06-28', products: ['Cloud Basic'], activities: [], createdAt: '2025-04-10T09:00:00Z', updatedAt: '2025-06-28T14:00:00Z' },
  { id: '6', title: 'HealthTech Integration', contactId: '9', value: 95000, currency: 'USD', stage: 'proposal', probability: 50, assignedTo: 'Admin User', expectedCloseDate: '2026-09-01', products: ['Integration Suite'], activities: [], createdAt: '2025-06-10T12:00:00Z', updatedAt: '2025-07-07T10:00:00Z' },
];

export const MOCK_TASKS: Task[] = [
  { id: '1', title: 'Follow up with TechCorp on contract review', assignedTo: 'Admin User', status: 'in_progress', priority: 'high', dueDate: '2026-07-12', tags: ['follow-up'], relatedTo: { type: 'deal', id: '1' }, createdAt: '2025-07-07T10:00:00Z', updatedAt: '2025-07-09T09:00:00Z' },
  { id: '2', title: 'Prepare AI demo for Innovate.io', assignedTo: 'Manager User', status: 'todo', priority: 'high', dueDate: '2026-07-15', tags: ['demo', 'ai'], relatedTo: { type: 'deal', id: '2' }, createdAt: '2025-07-08T09:00:00Z', updatedAt: '2025-07-08T09:00:00Z' },
  { id: '3', title: 'Send proposal to RetailMax', assignedTo: 'Manager User', status: 'review', priority: 'urgent', dueDate: '2026-07-10', tags: ['proposal'], relatedTo: { type: 'deal', id: '3' }, createdAt: '2025-07-06T14:00:00Z', updatedAt: '2025-07-09T08:00:00Z' },
  { id: '4', title: 'Schedule call with FinTech Gulf CEO', assignedTo: 'Admin User', status: 'todo', priority: 'medium', dueDate: '2026-07-14', tags: ['call'], relatedTo: { type: 'lead', id: '5' }, createdAt: '2025-07-08T16:00:00Z', updatedAt: '2025-07-08T16:00:00Z' },
  { id: '5', title: 'Update CRM with new contact info', assignedTo: 'Regular User', status: 'done', priority: 'low', dueDate: '2026-07-08', completedAt: '2026-07-08T15:00:00Z', tags: ['admin'], createdAt: '2025-07-07T11:00:00Z', updatedAt: '2025-07-08T15:00:00Z' },
  { id: '6', title: 'Research competitive pricing', assignedTo: 'Admin User', status: 'in_progress', priority: 'medium', dueDate: '2026-07-18', tags: ['research'], createdAt: '2025-07-05T10:00:00Z', updatedAt: '2025-07-09T10:00:00Z' },
  { id: '7', title: 'Quarterly review presentation', assignedTo: 'Manager User', status: 'todo', priority: 'high', dueDate: '2026-07-20', tags: ['presentation'], createdAt: '2025-07-09T08:00:00Z', updatedAt: '2025-07-09T08:00:00Z' },
  { id: '8', title: 'Onboard new team member', assignedTo: 'Admin User', status: 'in_progress', priority: 'medium', dueDate: '2026-07-16', tags: ['hr'], createdAt: '2025-07-08T09:00:00Z', updatedAt: '2025-07-09T10:00:00Z' },
];

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalContacts: 1248,
  totalLeads: 356,
  totalDeals: 89,
  totalRevenue: 2450000,
  conversionRate: 24.8,
  openTasks: 42,
  revenueByMonth: [
    { month: 'Jan', revenue: 180000 },
    { month: 'Feb', revenue: 220000 },
    { month: 'Mar', revenue: 195000 },
    { month: 'Apr', revenue: 280000 },
    { month: 'May', revenue: 310000 },
    { month: 'Jun', revenue: 265000 },
    { month: 'Jul', revenue: 340000 },
    { month: 'Aug', revenue: 295000 },
    { month: 'Sep', revenue: 380000 },
    { month: 'Oct', revenue: 420000 },
    { month: 'Nov', revenue: 365000 },
    { month: 'Dec', revenue: 400000 },
  ],
  leadsByStage: [
    { stage: 'New', count: 45 },
    { stage: 'Contacted', count: 38 },
    { stage: 'Qualified', count: 62 },
    { stage: 'Proposal', count: 28 },
    { stage: 'Negotiation', count: 15 },
    { stage: 'Won', count: 89 },
    { stage: 'Lost', count: 34 },
  ],
  dealsByStage: [
    { stage: 'Discovery', count: 12, value: 340000 },
    { stage: 'Proposal', count: 18, value: 720000 },
    { stage: 'Negotiation', count: 8, value: 560000 },
    { stage: 'Contract', count: 5, value: 380000 },
    { stage: 'Won', count: 42, value: 2800000 },
    { stage: 'Lost', count: 4, value: 120000 },
  ],
  recentActivities: [
    { id: '1', type: 'call', title: 'Call with Sarah Johnson', date: '2026-07-09T09:30:00Z', userId: '1', description: 'Discussed contract terms' },
    { id: '2', type: 'email', title: 'Proposal sent to RetailMax', date: '2026-07-09T08:15:00Z', userId: '2' },
    { id: '3', type: 'meeting', title: 'Demo with Innovate.io team', date: '2026-07-08T14:00:00Z', userId: '1' },
    { id: '4', type: 'note', title: 'Updated pricing for FinTech Gulf', date: '2026-07-08T11:30:00Z', userId: '1' },
    { id: '5', type: 'task', title: 'Follow-up scheduled for TechCorp', date: '2026-07-07T16:00:00Z', userId: '2' },
  ],
  topPerformers: [
    { name: 'Admin User', deals: 15, revenue: 890000 },
    { name: 'Manager User', deals: 12, revenue: 720000 },
    { name: 'Regular User', deals: 8, revenue: 450000 },
    { name: 'Sales Rep 1', deals: 6, revenue: 280000 },
  ],
};
