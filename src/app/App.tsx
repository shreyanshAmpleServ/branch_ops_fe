import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDesignStore } from '../store/useDesignStore';
import { AuthGuard } from '../guards/AuthGuard';
import { GuestGuard } from '../guards/GuestGuard';

// Auth pages
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';

// Design layouts
import { Layout1, DashboardHome1 } from '../designs/design1';
import { Layout2, DashboardHome2 } from '../designs/design2';
import { Layout3, DashboardHome3 } from '../designs/design3';

// Feature pages
import { CustomerList } from '../features/customers/CustomerList';
import { LeadList } from '../features/leads/LeadList';
import { DealList } from '../features/deals/DealList';
import { TaskList } from '../features/tasks/TaskList';
import { AnalyticsDashboard } from '../features/analytics/AnalyticsDashboard';
import { GeneralSettings } from '../features/settings/GeneralSettings';
import { ProfilePage } from '../features/profile/ProfilePage';
import { LogoutModal } from '../features/auth/LogoutModal';
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

const DesignLayout: React.FC = () => {
  const { activeDesign } = useDesignStore();
  const layouts = { design1: Layout1, design2: Layout2, design3: Layout3 };
  const ActiveLayout = layouts[activeDesign];
  return <ActiveLayout />;
};

const DashboardHome: React.FC = () => {
  const { activeDesign } = useDesignStore();
  const homes = { design1: DashboardHome1, design2: DashboardHome2, design3: DashboardHome3 };
  const ActiveHome = homes[activeDesign];
  return <ActiveHome />;
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
        <Route path="/register" element={<GuestGuard><RegisterPage /></GuestGuard>} />

        {/* Protected routes with layout */}
        <Route element={<AuthGuard><DesignLayout /></AuthGuard>}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/contacts" element={<CustomerList />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/leads" element={<LeadList />} />
          <Route path="/deals" element={<DealList />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/suppliers/list" element={<SupplierList />} />
          <Route path="/suppliers/approve" element={<ApproveSupplier />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/invoice" element={<ARInvoice />} />
          <Route path="/banking" element={<Banking />} />
          <Route path="/banking/incoming" element={<DummyModulePage title="Incoming Payments" />} />
          <Route path="/banking/outgoing" element={<DummyModulePage title="Outgoing Payments" />} />
          <Route path="/banking/petty-cash" element={<DummyModulePage title="Petty Cash" />} />
          <Route path="/banking/pending-po" element={<DummyModulePage title="Pending Po Payments" />} />
          
          {/* Procurement */}
          <Route path="/procurement/request" element={<PurchaseRequestList />} />
          <Route path="/procurement/request/new" element={<PurchaseRequestFormPage mode="add" />} />
          <Route path="/procurement/request/edit/:id" element={<PurchaseRequestFormPage mode="edit" />} />
          <Route path="/procurement/request/view/:id" element={<PurchaseRequestFormPage mode="view" />} />
          <Route path="/procurement/wizard" element={<DummyModulePage title="Purchase Wizard" />} />
          <Route path="/procurement/quotation" element={<DummyModulePage title="Purchase Quotation" />} />
          <Route path="/procurement/order" element={<DummyModulePage title="Purchase Order" />} />
          <Route path="/procurement/notice" element={<DummyModulePage title="Notice Arrival" />} />
          <Route path="/procurement/advance" element={<DummyModulePage title="Advance Request" />} />
          <Route path="/procurement/grpo" element={<DummyModulePage title="GRPO" />} />
          <Route path="/procurement/ap-invoice" element={<DummyModulePage title="AP Invoice" />} />
          
          {/* Warehouse & Stock */}
          <Route path="/warehouse/manage" element={<WarehouseManagement />} />
          <Route path="/warehouse/items" element={<ItemManagement />} />
          
          {/* Fuel Station */}
          <Route path="/fuel/station-master" element={<DummyModulePage title="Fuel Station Master" />} />
          <Route path="/fuel/shift-master" element={<DummyModulePage title="Fuel Shift Master" />} />
          <Route path="/fuel/receiving" element={<DummyModulePage title="Fuel Receiving" />} />
          <Route path="/fuel/operations" element={<DummyModulePage title="Fuel Operations" />} />
          <Route path="/fuel/reconciliation" element={<DummyModulePage title="Shift Reconciliation" />} />
          <Route path="/fuel/shift-history" element={<DummyModulePage title="Fuel Shift History" />} />
          <Route path="/fuel/sales-report" element={<DummyModulePage title="Fuel Sales Report" />} />
          <Route path="/fuel/stock" element={<DummyModulePage title="Fuel Stock" />} />
          <Route path="/fuel/nozzle" element={<DummyModulePage title="Fuel Nozzle" />} />
          
          <Route path="/stock/ageing" element={<DummyModulePage title="Stock Ageing Analysis" />} />
          <Route path="/stock/counting" element={<DummyModulePage title="Stock Counting" />} />
          <Route path="/stock/transfer-request" element={<DummyModulePage title="Transfer Request" />} />
          <Route path="/stock/transfer" element={<DummyModulePage title="Inventory Transfer" />} />
          <Route path="/stock/receipt" element={<DummyModulePage title="Goods Receipt" />} />
          <Route path="/stock/issue" element={<DummyModulePage title="Goods Issue" />} />

          {/* Projects */}
          <Route path="/projects/manage" element={<DummyModulePage title="Project Management" />} />
          <Route path="/projects/analytics" element={<DummyModulePage title="Executive Analytics" />} />
          <Route path="/projects/finance" element={<DummyModulePage title="Stage Financial Progress" />} />

          {/* System & Admin */}
          <Route path="/system/approvals" element={<DummyModulePage title="Approver Management" />} />
          <Route path="/system/notes" element={<DummyModulePage title="Notes" />} />
          <Route path="/system/complaints" element={<DummyModulePage title="Complaints" />} />
          <Route path="/system/config/document" element={<DummyModulePage title="Document Setting" />} />
          <Route path="/system/config/terms" element={<DummyModulePage title="Terms Conditions" />} />
          <Route path="/system/config/company" element={<CompanyDetails />} />
          <Route path="/system/config/branch" element={<BranchSetup />} />
          <Route path="/system/config/workflow" element={<DummyModulePage title="Approval Workflow" />} />
          <Route path="/system/config/activity" element={<DummyModulePage title="Activity" />} />
          <Route path="/system/config/expenses" element={<ExpenseEntryPage />} />
          <Route path="/system/config/freight" element={<DummyModulePage title="Freight Charges" />} />
          <Route path="/system/integration" element={<DummyModulePage title="Integration Monitor" />} />

          <Route path="/assistant" element={<AskAssistant />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings/general" element={<GeneralSettings />} />
          <Route path="/settings/users" element={<UserManagement />} />
          <Route path="/settings/roles" element={<RolePermissions />} />
          <Route path="/settings" element={<Navigate to="/settings/general" replace />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <LogoutModal />
    </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
