import { LayoutDashboard, Users, Target, Handshake, CheckSquare, BarChart3, Settings, UserCog, Shield, Truck, Warehouse, Network, Boxes, ClipboardCheck, FileText, AlertCircle, Sliders, Activity, ArrowDownCircle, ArrowUpCircle, Wallet, FileClock, Fuel, UserCheck, Calculator, Scale, History, Store } from 'lucide-react';
import type { Permission } from '../types/auth.types';

export interface NavItem {
  id: string;
  label: string;
  translationKey: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  permission?: Permission;
  children?: NavItem[];
  badge?: string;
  isHeader?: boolean;
}

export const NAVIGATION: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', translationKey: 'nav.dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'users', label: 'Users Management', translationKey: 'nav.userManagement', icon: UserCog, path: '/settings/users', permission: 'users.view' },
  
  
  { id: 'sales-crm-header', label: 'SALES', translationKey: 'nav.salesCrm', isHeader: true },
  { id: 'customers', label: 'Customer Management', translationKey: 'nav.customers', icon: Users, path: '/customers' },
  { 
    id: 'suppliers', 
    label: 'Supplier Management', 
    translationKey: 'nav.suppliers', 
    icon: Target, 
    path: '/suppliers',
    children: [
      { id: 'suppliers-list', label: 'Suppliers List', translationKey: 'nav.suppliersList', path: '/suppliers/list' },
      { id: 'approve-supplier', label: 'Approve Supplier', translationKey: 'nav.approveSupplier', path: '/suppliers/approve' },
    ]
  },
  { id: 'quotations', label: 'Quotations', translationKey: 'nav.quotations', icon: CheckSquare, path: '/quotations' },
  { id: 'orders', label: 'Orders', translationKey: 'nav.orders', icon: Handshake, path: '/deals' },
  { id: 'ar-invoice', label: 'AR Invoice', translationKey: 'nav.arInvoice', icon: BarChart3, path: '/invoice' },
  { 
    id: 'banking', 
    label: 'Banking', 
    translationKey: 'nav.banking', 
    icon: Settings, 
    path: '/banking',
    children: [
      { id: 'banking-incoming', label: 'Incoming Payments', translationKey: 'nav.incomingPayments', path: '/banking/incoming' },
      { id: 'banking-outgoing', label: 'Outgoing Payments', translationKey: 'nav.outgoingPayments', path: '/banking/outgoing' },
      { id: 'banking-petty', label: 'Petty Cash', translationKey: 'nav.pettyCash', path: '/banking/petty-cash' },
      { id: 'banking-pending', label: 'Pending Po Payments', translationKey: 'nav.pendingPoPayments', path: '/banking/pending-po' },
    ]
  },
  { id: 'ask-assistant', label: 'Ask Assistant', translationKey: 'nav.askAssistant', icon: LayoutDashboard, path: '/assistant' },

  { id: 'supply-chain-header', label: 'SUPPLY CHAIN & STOCK', translationKey: 'nav.supplyChain', isHeader: true },
  {
    id: 'procurement',
    label: 'Procurement Module',
    translationKey: 'nav.procurement',
    icon: Truck,
    path: '/procurement',
    children: [
      { id: 'proc-request', label: 'Purchase Request', translationKey: 'nav.purchaseRequest', path: '/procurement/request' },
      { id: 'proc-wizard', label: 'Purchase Wizard', translationKey: 'nav.purchaseWizard', path: '/procurement/wizard' },
      { id: 'proc-quote', label: 'Purchase Quotation', translationKey: 'nav.purchaseQuotation', path: '/procurement/quotation' },
      { id: 'proc-order', label: 'Purchase Order', translationKey: 'nav.purchaseOrder', path: '/procurement/order' },
      { id: 'proc-notice', label: 'Notice Arrival', translationKey: 'nav.noticeArrival', path: '/procurement/notice' },
      { id: 'proc-advance', label: 'Advance Request', translationKey: 'nav.advanceRequest', path: '/procurement/advance' },
      { id: 'proc-grpo', label: 'GRPO', translationKey: 'nav.grpo', path: '/procurement/grpo' },
      { id: 'proc-ap-invoice', label: 'AP Invoice', translationKey: 'nav.apInvoice', path: '/procurement/ap-invoice' },
    ]
  },
  {
    id: 'warehouse',
    label: 'Stock at Warehouse',
    translationKey: 'nav.warehouse',
    icon: Warehouse,
    path: '/warehouse',
    children: [
      { id: 'wh-manage', label: 'Manage Warehouse', translationKey: 'nav.manageWarehouse', path: '/warehouse/manage' },
      { id: 'wh-items', label: 'Manage Items', translationKey: 'nav.manageItems', path: '/warehouse/items' },
    ]
  },
  {
    id: 'fuel-station',
    label: 'Fuel Station',
    translationKey: 'nav.fuelStation',
    icon: Fuel,
    path: '/fuel',
    children: [
      { id: 'fuel-station-master', label: 'Fuel Station Master', translationKey: 'nav.fuelStationMaster', path: '/fuel/station-master', icon: Store },
      { id: 'fuel-shift-master', label: 'Fuel Shift Master', translationKey: 'nav.fuelShiftMaster', path: '/fuel/shift-master', icon: UserCheck },
      { id: 'fuel-receiving', label: 'Fuel Receiving', translationKey: 'nav.fuelReceiving', path: '/fuel/receiving', icon: Truck },
      { id: 'fuel-operations', label: 'Fuel Operations', translationKey: 'nav.fuelOperations', path: '/fuel/operations', icon: Calculator },
      { id: 'fuel-reconciliation', label: 'Shift Reconciliation', translationKey: 'nav.shiftReconciliation', path: '/fuel/reconciliation', icon: Scale },
      { id: 'fuel-shift-history', label: 'Fuel Shift History', translationKey: 'nav.fuelShiftHistory', path: '/fuel/shift-history', icon: History },
      { id: 'fuel-sales-report', label: 'Fuel Sales Report', translationKey: 'nav.fuelSalesReport', path: '/fuel/sales-report', icon: BarChart3 },
      { id: 'fuel-stock', label: 'Fuel Stock', translationKey: 'nav.fuelStock', path: '/fuel/stock', icon: Boxes },
      { id: 'fuel-nozzle', label: 'Fuel Nozzle', translationKey: 'nav.fuelNozzle', path: '/fuel/nozzle', icon: Fuel },
    ]
  },
  {
    id: 'projects',
    label: 'Projects',
    translationKey: 'nav.projects',
    icon: Network,
    path: '/projects',
    children: [
      { id: 'proj-manage', label: 'Project Management', translationKey: 'nav.projectManagement', path: '/projects/manage' },
      { id: 'proj-analytics', label: 'Executive Analytics', translationKey: 'nav.executiveAnalytics', path: '/projects/analytics' },
      { id: 'proj-finance', label: 'Stage Financial Progress', translationKey: 'nav.stageFinancial', path: '/projects/finance' },
    ]
  },
  {
    id: 'stock-management',
    label: 'Stock Management',
    translationKey: 'nav.stockManagement',
    icon: Boxes,
    path: '/stock',
    children: [
      { id: 'stk-ageing', label: 'Stock Ageing Analysis', translationKey: 'nav.stockAgeing', path: '/stock/ageing' },
      { id: 'stk-counting', label: 'Stock Counting', translationKey: 'nav.stockCounting', path: '/stock/counting' },
      { id: 'stk-transfer-req', label: 'Transfer Request', translationKey: 'nav.transferRequest', path: '/stock/transfer-request' },
      { id: 'stk-transfer', label: 'Inventory Transfer', translationKey: 'nav.inventoryTransfer', path: '/stock/transfer' },
      { id: 'stk-receipt', label: 'Goods Receipt', translationKey: 'nav.goodsReceipt', path: '/stock/receipt' },
      { id: 'stk-issue', label: 'Goods Issue', translationKey: 'nav.goodsIssue', path: '/stock/issue' },
    ]
  },

  { id: 'system-admin-header', label: 'SYSTEM & ADMIN', translationKey: 'nav.systemAdmin', isHeader: true },
  { id: 'approval-mgmt', label: 'Approver Management', translationKey: 'nav.approverManagement', icon: ClipboardCheck, path: '/system/approvals' },
  { id: 'notes', label: 'Notes', translationKey: 'nav.notes', icon: FileText, path: '/system/notes' },
  { id: 'complaints', label: 'Complaints', translationKey: 'nav.complaints', icon: AlertCircle, path: '/system/complaints' },
  {
    id: 'configuration',
    label: 'Configuration',
    translationKey: 'nav.configuration',
    icon: Sliders,
    path: '/system/config',
    children: [
      { id: 'conf-doc', label: 'Document Setting', translationKey: 'nav.docSetting', path: '/system/config/document' },
      { id: 'conf-terms', label: 'Terms Conditions', translationKey: 'nav.terms', path: '/system/config/terms' },
      { id: 'conf-company', label: 'Company Details', translationKey: 'nav.companyDetails', path: '/system/config/company' },
      { id: 'conf-branch', label: 'Branch Setup', translationKey: 'nav.branchSetup', path: '/system/config/branch' },
      { id: 'conf-workflow', label: 'Approval Workflow', translationKey: 'nav.approvalWorkflow', path: '/system/config/workflow' },
      { id: 'conf-activity', label: 'Activity', translationKey: 'nav.activity', path: '/system/config/activity' },
      { id: 'conf-expenses', label: 'Expenses', translationKey: 'nav.expenses', path: '/system/config/expenses' },
      { id: 'conf-freight', label: 'Freight Charges', translationKey: 'nav.freightCharges', path: '/system/config/freight' },
    ]
  },
  { id: 'integration', label: 'Integration Monitor', translationKey: 'nav.integration', icon: Activity, path: '/system/integration' },

  { id: 'roles', label: 'Roles & Permissions', translationKey: 'nav.roles', icon: Shield, path: '/settings/roles', permission: 'settings.edit' },
  
  {
    id: 'settings',
    label: 'Settings',
    translationKey: 'nav.settings',
    icon: Settings,
    path: '/settings',
    children: [
      { id: 'settings-general', label: 'General', translationKey: 'nav.general', path: '/settings/general' },
    ],
  },
];
