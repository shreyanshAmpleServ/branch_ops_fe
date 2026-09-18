import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDesignStore } from '../store/useDesignStore';

// Auth pages
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';

// Design layouts
import { DashboardHome1 } from '../designs/design1';
import { DashboardHome2 } from '../designs/design2';
import { DashboardHome3 } from '../designs/design3';

// Feature pages
import { CustomerList } from '../features/customers/CustomerList';
import { LeadList } from '../features/leads/LeadList';
import { DealList } from '../features/deals/DealList';
import { TaskList } from '../features/tasks/TaskList';
import { AnalyticsDashboard } from '../features/analytics/AnalyticsDashboard';
import { GeneralSettings } from '../features/settings/GeneralSettings';
import { ProfilePage } from '../features/profile/ProfilePage';
import { SupplierList } from '../features/suppliers/SupplierList';
import { ApproveSupplier } from '../features/suppliers/ApproveSupplier';
import { Quotations } from '../features/quotations/Quotations';
import { QuotationFormPage } from '../features/quotations/QuotationFormPage';
import { QuotationViewPage } from '../features/quotations/QuotationViewPage';
import { SalesOrderFormPage } from '../features/deals/SalesOrderFormPage';
import { SalesOrderViewPage } from '../features/deals/SalesOrderViewPage';
import { ARInvoice } from '../features/invoice/ARInvoice';
import { ARInvoiceFormPage } from '../features/invoice/ARInvoiceFormPage';
import { ARInvoiceViewPage } from '../features/invoice/ARInvoiceViewPage';
import { Banking } from '../features/banking/Banking';
import { IncomingPaymentsPage } from '../features/banking/IncomingPaymentsPage';
import { OutgoingPaymentsPage } from '../features/banking/OutgoingPaymentsPage';
import { PettyCashPage } from '../features/banking/PettyCashPage';
import { PendingPoPaymentsPage } from '../features/banking/PendingPoPaymentsPage';
import { AskAssistant } from '../features/assistant/AskAssistant';
import { UserManagement } from '../features/users/UserManagement';
import { RolePermissions } from '../features/users/RolePermissions';
import { DummyModulePage } from '../features/common/DummyModulePage';
import { BranchSetup } from '../features/settings/BranchSetup';
import { CompanyDetails } from '../features/settings/CompanyDetails';
import { ExpenseEntryPage } from '../features/settings/ExpenseEntry';
import { WarehouseManagement } from '../features/warehouse/WarehouseManagement';
import { ItemManagement } from '../features/items/ItemManagement';
import { ItemPricesPage } from '../features/item-prices';
import {
  PurchaseRequestList,
  PurchaseRequestFormPage,
  PurchaseQuotationList,
  PurchaseQuotationFormPage,
  PurchaseQuotationViewPage,
  PurchaseOrderList,
  PurchaseOrderFormPage,
  PurchaseOrderViewPage,
  GoodsReceiptList,
  GoodsReceiptFormPage,
  GoodsReceiptViewPage,
  APInvoiceList,
  APInvoiceFormPage,
  APInvoiceViewPage
} from '../features/procurement';
import {
  ProjectManagement,
  ProjectAnalytics,
  ProjectFinance
} from '../features/projects';

export const DashboardHome: React.FC = () => {
  const { activeDesign } = useDesignStore();
  const homes = { design1: DashboardHome1, design2: DashboardHome2, design3: DashboardHome3 };
  const ActiveHome = homes[activeDesign];
  return <ActiveHome />;
};

export interface AppRoute {
  path: string;
  element?: React.ReactNode;
  Component?: React.ComponentType<any>;
  title?: string;
  isPublic?: boolean;
  isProtected?: boolean;
}

export const routes: AppRoute[] = [
  // Public routes
  { path: "/login", element: <LoginPage />, isPublic: true },
  { path: "/register", element: <RegisterPage />, isPublic: true },

  // Protected routes
  { path: "/dashboard", element: <DashboardHome />, isProtected: true },
  { path: "/contacts", element: <CustomerList />, isProtected: true },
  { path: "/customers", element: <CustomerList />, isProtected: true },
  { path: "/leads", element: <LeadList />, isProtected: true },
  { path: "/deals", element: <DealList />, isProtected: true },
  { path: "/deals/new", element: <SalesOrderFormPage mode="add" />, isProtected: true },
  { path: "/deals/edit/:id", element: <SalesOrderFormPage mode="edit" />, isProtected: true },
  { path: "/deals/view/:id", element: <SalesOrderViewPage />, isProtected: true },
  { path: "/orders", element: <DealList />, isProtected: true },
  { path: "/orders/new", element: <SalesOrderFormPage mode="add" />, isProtected: true },
  { path: "/orders/edit/:id", element: <SalesOrderFormPage mode="edit" />, isProtected: true },
  { path: "/orders/view/:id", element: <SalesOrderViewPage />, isProtected: true },

  { path: "/tasks", element: <TaskList />, isProtected: true },
  { path: "/analytics", element: <AnalyticsDashboard />, isProtected: true },
  { path: "/suppliers/list", element: <SupplierList />, isProtected: true },
  { path: "/suppliers/approve", element: <ApproveSupplier />, isProtected: true },

  { path: "/quotations", element: <Quotations />, isProtected: true },
  { path: "/quotations/new", element: <QuotationFormPage mode="add" />, isProtected: true },
  { path: "/quotations/edit/:id", element: <QuotationFormPage mode="edit" />, isProtected: true },
  { path: "/quotations/view/:id", element: <QuotationViewPage />, isProtected: true },

  { path: "/invoice", element: <ARInvoice />, isProtected: true },
  { path: "/invoice/new", element: <ARInvoiceFormPage mode="add" />, isProtected: true },
  { path: "/invoice/edit/:id", element: <ARInvoiceFormPage mode="edit" />, isProtected: true },
  { path: "/invoice/view/:id", element: <ARInvoiceViewPage />, isProtected: true },
  { path: "/banking", element: <Banking />, isProtected: true },
  { path: "/banking/incoming", element: <IncomingPaymentsPage />, isProtected: true },
  { path: "/banking/outgoing", element: <OutgoingPaymentsPage />, isProtected: true },
  { path: "/banking/petty-cash", element: <PettyCashPage />, isProtected: true },
  { path: "/banking/pending-po", element: <PendingPoPaymentsPage />, isProtected: true },
  
  { path: "/procurement/request", element: <PurchaseRequestList />, isProtected: true },
  { path: "/procurement/request/new", element: <PurchaseRequestFormPage mode="add" />, isProtected: true },
  { path: "/procurement/request/edit/:id", element: <PurchaseRequestFormPage mode="edit" />, isProtected: true },
  { path: "/procurement/request/view/:id", element: <PurchaseRequestFormPage mode="view" />, isProtected: true },
  { path: "/procurement/wizard", element: <DummyModulePage title="Purchase Wizard" />, isProtected: true },
  { path: "/procurement/quotation", element: <PurchaseQuotationList />, isProtected: true },
  { path: "/procurement/quotation/new", element: <PurchaseQuotationFormPage mode="add" />, isProtected: true },
  { path: "/procurement/quotation/edit/:id", element: <PurchaseQuotationFormPage mode="edit" />, isProtected: true },
  { path: "/procurement/quotation/view/:id", element: <PurchaseQuotationViewPage />, isProtected: true },
  { path: "/procurement/order", element: <PurchaseOrderList />, isProtected: true },
  { path: "/procurement/order/new", element: <PurchaseOrderFormPage mode="add" />, isProtected: true },
  { path: "/procurement/order/edit/:id", element: <PurchaseOrderFormPage mode="edit" />, isProtected: true },
  { path: "/procurement/order/view/:id", element: <PurchaseOrderViewPage />, isProtected: true },
  { path: "/procurement/notice", element: <DummyModulePage title="Notice Arrival" />, isProtected: true },
  { path: "/procurement/advance", element: <DummyModulePage title="Advance Request" />, isProtected: true },
  { path: "/procurement/grpo", element: <GoodsReceiptList />, isProtected: true },
  { path: "/procurement/grpo/new", element: <GoodsReceiptFormPage mode="add" />, isProtected: true },
  { path: "/procurement/grpo/edit/:id", element: <GoodsReceiptFormPage mode="edit" />, isProtected: true },
  { path: "/procurement/grpo/view/:id", element: <GoodsReceiptViewPage />, isProtected: true },
  { path: "/procurement/ap-invoice", element: <APInvoiceList />, isProtected: true },
  { path: "/procurement/ap-invoice/new", element: <APInvoiceFormPage mode="add" />, isProtected: true },
  { path: "/procurement/ap-invoice/edit/:id", element: <APInvoiceFormPage mode="edit" />, isProtected: true },
  { path: "/procurement/ap-invoice/view/:id", element: <APInvoiceViewPage />, isProtected: true },
  
  { path: "/warehouse/manage", element: <WarehouseManagement />, isProtected: true },
  { path: "/warehouse/items", element: <ItemManagement />, isProtected: true },
  { path: "/warehouse/item-prices", element: <ItemPricesPage />, isProtected: true },
  
  { path: "/fuel/station-master", element: <DummyModulePage title="Fuel Station Master" />, isProtected: true },
  { path: "/fuel/shift-master", element: <DummyModulePage title="Fuel Shift Master" />, isProtected: true },
  { path: "/fuel/receiving", element: <DummyModulePage title="Fuel Receiving" />, isProtected: true },
  { path: "/fuel/operations", element: <DummyModulePage title="Fuel Operations" />, isProtected: true },
  { path: "/fuel/reconciliation", element: <DummyModulePage title="Shift Reconciliation" />, isProtected: true },
  { path: "/fuel/shift-history", element: <DummyModulePage title="Fuel Shift History" />, isProtected: true },
  { path: "/fuel/sales-report", element: <DummyModulePage title="Fuel Sales Report" />, isProtected: true },
  { path: "/fuel/stock", element: <DummyModulePage title="Fuel Stock" />, isProtected: true },
  { path: "/fuel/nozzle", element: <DummyModulePage title="Fuel Nozzle" />, isProtected: true },
  
  { path: "/stock/ageing", element: <DummyModulePage title="Stock Ageing Analysis" />, isProtected: true },
  { path: "/stock/counting", element: <DummyModulePage title="Stock Counting" />, isProtected: true },
  { path: "/stock/transfer-request", element: <DummyModulePage title="Transfer Request" />, isProtected: true },
  { path: "/stock/transfer", element: <DummyModulePage title="Inventory Transfer" />, isProtected: true },
  { path: "/stock/receipt", element: <DummyModulePage title="Goods Receipt" />, isProtected: true },
  { path: "/stock/issue", element: <DummyModulePage title="Goods Issue" />, isProtected: true },

  { path: "/projects/manage", element: <ProjectManagement />, isProtected: true },
  { path: "/projects/analytics", element: <ProjectAnalytics />, isProtected: true },
  { path: "/projects/finance", element: <ProjectFinance />, isProtected: true },

  { path: "/system/approvals", element: <DummyModulePage title="Approver Management" />, isProtected: true },
  { path: "/system/notes", element: <DummyModulePage title="Notes" />, isProtected: true },
  { path: "/system/complaints", element: <DummyModulePage title="Complaints" />, isProtected: true },
  { path: "/system/config/document", element: <DummyModulePage title="Document Setting" />, isProtected: true },
  { path: "/system/config/terms", element: <DummyModulePage title="Terms Conditions" />, isProtected: true },
  { path: "/system/config/company", element: <CompanyDetails />, isProtected: true },
  { path: "/system/config/branch", element: <BranchSetup />, isProtected: true },
  { path: "/system/config/workflow", element: <DummyModulePage title="Approval Workflow" />, isProtected: true },
  { path: "/system/config/activity", element: <DummyModulePage title="Activity" />, isProtected: true },
  { path: "/system/config/expenses", element: <ExpenseEntryPage />, isProtected: true },
  { path: "/system/config/freight", element: <DummyModulePage title="Freight Charges" />, isProtected: true },
  { path: "/system/integration", element: <DummyModulePage title="Integration Monitor" />, isProtected: true },

  { path: "/assistant", element: <AskAssistant />, isProtected: true },
  { path: "/profile", element: <ProfilePage />, isProtected: true },
  { path: "/settings/general", element: <GeneralSettings />, isProtected: true },
  { path: "/settings/users", element: <UserManagement />, isProtected: true },
  { path: "/settings/roles", element: <RolePermissions />, isProtected: true },
  { path: "/settings", element: <Navigate to="/settings/general" replace />, isProtected: true },
];
