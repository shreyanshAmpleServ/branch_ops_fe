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
import { ARInvoice } from '../features/invoice/ARInvoice';
import { Banking } from '../features/banking/Banking';
import { AskAssistant } from '../features/assistant/AskAssistant';
import { UserManagement } from '../features/users/UserManagement';
import { RolePermissions } from '../features/users/RolePermissions';
import { DummyModulePage } from '../features/common/DummyModulePage';
import { BranchSetup } from '../features/settings/BranchSetup';
import { CompanyDetails } from '../features/settings/CompanyDetails';
import { ExpenseEntryPage } from '../features/settings/ExpenseEntry';
import { WarehouseManagement } from '../features/warehouse/WarehouseManagement';
import { ItemManagement } from '../features/items/ItemManagement';
import { PurchaseRequestList } from '../features/procurement/PurchaseRequestList';
import { PurchaseRequestFormPage } from '../features/procurement/PurchaseRequestFormPage';

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
  { path: "/tasks", element: <TaskList />, isProtected: true },
  { path: "/analytics", element: <AnalyticsDashboard />, isProtected: true },
  { path: "/suppliers/list", element: <SupplierList />, isProtected: true },
  { path: "/suppliers/approve", element: <ApproveSupplier />, isProtected: true },
  { path: "/quotations", element: <Quotations />, isProtected: true },
  { path: "/invoice", element: <ARInvoice />, isProtected: true },
  { path: "/banking", element: <Banking />, isProtected: true },
  { path: "/banking/incoming", element: <DummyModulePage title="Incoming Payments" />, isProtected: true },
  { path: "/banking/outgoing", element: <DummyModulePage title="Outgoing Payments" />, isProtected: true },
  { path: "/banking/petty-cash", element: <DummyModulePage title="Petty Cash" />, isProtected: true },
  { path: "/banking/pending-po", element: <DummyModulePage title="Pending Po Payments" />, isProtected: true },
  
  { path: "/procurement/request", element: <PurchaseRequestList />, isProtected: true },
  { path: "/procurement/request/new", element: <PurchaseRequestFormPage mode="add" />, isProtected: true },
  { path: "/procurement/request/edit/:id", element: <PurchaseRequestFormPage mode="edit" />, isProtected: true },
  { path: "/procurement/request/view/:id", element: <PurchaseRequestFormPage mode="view" />, isProtected: true },
  { path: "/procurement/wizard", element: <DummyModulePage title="Purchase Wizard" />, isProtected: true },
  { path: "/procurement/quotation", element: <DummyModulePage title="Purchase Quotation" />, isProtected: true },
  { path: "/procurement/order", element: <DummyModulePage title="Purchase Order" />, isProtected: true },
  { path: "/procurement/notice", element: <DummyModulePage title="Notice Arrival" />, isProtected: true },
  { path: "/procurement/advance", element: <DummyModulePage title="Advance Request" />, isProtected: true },
  { path: "/procurement/grpo", element: <DummyModulePage title="GRPO" />, isProtected: true },
  { path: "/procurement/ap-invoice", element: <DummyModulePage title="AP Invoice" />, isProtected: true },
  
  { path: "/warehouse/manage", element: <WarehouseManagement />, isProtected: true },
  { path: "/warehouse/items", element: <ItemManagement />, isProtected: true },
  
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

  { path: "/projects/manage", element: <DummyModulePage title="Project Management" />, isProtected: true },
  { path: "/projects/analytics", element: <DummyModulePage title="Executive Analytics" />, isProtected: true },
  { path: "/projects/finance", element: <DummyModulePage title="Stage Financial Progress" />, isProtected: true },

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
