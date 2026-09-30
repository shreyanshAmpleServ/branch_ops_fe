import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAVIGATION } from '../../config/navigation';

interface RouteMeta {
  title: string;
  category?: string;
}

// Special dynamic route patterns and overrides
const ROUTE_TITLE_MAP: { pattern: RegExp; meta: (matches: RegExpMatchArray) => RouteMeta }[] = [
  // Dashboard
  { pattern: /^\/dashboard$/, meta: () => ({ title: 'Dashboard', category: 'Overview' }) },

  // Customer & Leads
  { pattern: /^\/customers$/, meta: () => ({ title: 'Customer Management', category: 'Sales' }) },
  { pattern: /^\/contacts$/, meta: () => ({ title: 'Contacts', category: 'Sales' }) },
  { pattern: /^\/leads$/, meta: () => ({ title: 'Leads Management', category: 'Sales' }) },

  // Quotations
  { pattern: /^\/quotations\/new$/, meta: () => ({ title: 'New Sales Quotation', category: 'Sales Module' }) },
  { pattern: /^\/quotations\/edit\/(.+)$/, meta: () => ({ title: 'Edit Sales Quotation', category: 'Sales Module' }) },
  { pattern: /^\/quotations\/view\/(.+)$/, meta: () => ({ title: 'Sales Quotation Details', category: 'Sales Module' }) },
  { pattern: /^\/quotations$/, meta: () => ({ title: 'Sales Quotations', category: 'Sales Module' }) },

  // Sales Orders (Deals)
  { pattern: /^\/deals\/new$/, meta: () => ({ title: 'New Sales Order', category: 'Sales Module' }) },
  { pattern: /^\/deals\/edit\/(.+)$/, meta: () => ({ title: 'Edit Sales Order', category: 'Sales Module' }) },
  { pattern: /^\/deals\/view\/(.+)$/, meta: () => ({ title: 'Sales Order Details', category: 'Sales Module' }) },
  { pattern: /^\/deals$/, meta: () => ({ title: 'Sales Orders', category: 'Sales Module' }) },
  { pattern: /^\/orders\/new$/, meta: () => ({ title: 'New Sales Order', category: 'Sales Module' }) },
  { pattern: /^\/orders\/edit\/(.+)$/, meta: () => ({ title: 'Edit Sales Order', category: 'Sales Module' }) },
  { pattern: /^\/orders\/view\/(.+)$/, meta: () => ({ title: 'Sales Order Details', category: 'Sales Module' }) },
  { pattern: /^\/orders$/, meta: () => ({ title: 'Sales Orders', category: 'Sales Module' }) },

  // AR Invoice
  { pattern: /^\/invoice\/new$/, meta: () => ({ title: 'New AR Invoice', category: 'Sales Module' }) },
  { pattern: /^\/invoice\/edit\/(.+)$/, meta: () => ({ title: 'Edit AR Invoice', category: 'Sales Module' }) },
  { pattern: /^\/invoice\/view\/(.+)$/, meta: () => ({ title: 'AR Invoice Details', category: 'Sales Module' }) },
  { pattern: /^\/invoice$/, meta: () => ({ title: 'AR Invoices', category: 'Sales Module' }) },

  // Suppliers
  { pattern: /^\/suppliers\/list$/, meta: () => ({ title: 'Suppliers List', category: 'Supplier Management' }) },
  { pattern: /^\/suppliers\/approve$/, meta: () => ({ title: 'Approve Supplier', category: 'Supplier Management' }) },
  { pattern: /^\/suppliers$/, meta: () => ({ title: 'Supplier Management', category: 'Sales' }) },

  // Banking
  { pattern: /^\/banking\/incoming$/, meta: () => ({ title: 'Incoming Payments', category: 'Banking' }) },
  { pattern: /^\/banking\/outgoing$/, meta: () => ({ title: 'Outgoing Payments', category: 'Banking' }) },
  { pattern: /^\/banking\/petty-cash$/, meta: () => ({ title: 'Petty Cash', category: 'Banking' }) },
  { pattern: /^\/banking\/pending-po$/, meta: () => ({ title: 'Pending PO Payments', category: 'Banking' }) },
  { pattern: /^\/banking$/, meta: () => ({ title: 'Banking Overview', category: 'Financials' }) },

  // Ask Assistant
  { pattern: /^\/assistant$/, meta: () => ({ title: 'Ask Assistant', category: 'AI Tools' }) },

  // Procurement - Purchase Request
  { pattern: /^\/procurement\/request\/new$/, meta: () => ({ title: 'New Purchase Request', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/request\/edit\/(.+)$/, meta: () => ({ title: 'Edit Purchase Request', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/request\/view\/(.+)$/, meta: () => ({ title: 'Purchase Request Details', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/request$/, meta: () => ({ title: 'Purchase Requests', category: 'Procurement Module' }) },

  // Procurement - Wizard
  { pattern: /^\/procurement\/wizard$/, meta: () => ({ title: 'Purchase Wizard', category: 'Procurement Module' }) },

  // Procurement - Purchase Quotation
  { pattern: /^\/procurement\/quotation\/new$/, meta: () => ({ title: 'New Purchase Quotation', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/quotation\/edit\/(.+)$/, meta: () => ({ title: 'Edit Purchase Quotation', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/quotation\/view\/(.+)$/, meta: () => ({ title: 'Purchase Quotation Details', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/quotation$/, meta: () => ({ title: 'Purchase Quotations', category: 'Procurement Module' }) },

  // Procurement - Purchase Order
  { pattern: /^\/procurement\/order\/new$/, meta: () => ({ title: 'New Purchase Order', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/order\/edit\/(.+)$/, meta: () => ({ title: 'Edit Purchase Order', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/order\/view\/(.+)$/, meta: () => ({ title: 'Purchase Order Details', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/order$/, meta: () => ({ title: 'Purchase Orders', category: 'Procurement Module' }) },

  // Procurement - Notice & Advance
  { pattern: /^\/procurement\/notice$/, meta: () => ({ title: 'Notice Arrival', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/advance$/, meta: () => ({ title: 'Advance Request', category: 'Procurement Module' }) },

  // Procurement - GRPO
  { pattern: /^\/procurement\/grpo\/new$/, meta: () => ({ title: 'New Goods Receipt PO', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/grpo\/edit\/(.+)$/, meta: () => ({ title: 'Edit Goods Receipt PO', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/grpo\/view\/(.+)$/, meta: () => ({ title: 'Goods Receipt PO Details', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/grpo$/, meta: () => ({ title: 'Goods Receipt PO (GRPO)', category: 'Procurement Module' }) },

  // Procurement - AP Invoice
  { pattern: /^\/procurement\/ap-invoice\/new$/, meta: () => ({ title: 'New AP Invoice', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/ap-invoice\/edit\/(.+)$/, meta: () => ({ title: 'Edit AP Invoice', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/ap-invoice\/view\/(.+)$/, meta: () => ({ title: 'AP Invoice Details', category: 'Procurement Module' }) },
  { pattern: /^\/procurement\/ap-invoice$/, meta: () => ({ title: 'AP Invoices', category: 'Procurement Module' }) },

  // Warehouse
  { pattern: /^\/warehouse\/manage$/, meta: () => ({ title: 'Manage Warehouse', category: 'Stock at Warehouse' }) },
  { pattern: /^\/warehouse\/items$/, meta: () => ({ title: 'Manage Items', category: 'Stock at Warehouse' }) },
  { pattern: /^\/warehouse\/item-prices$/, meta: () => ({ title: 'Item Prices', category: 'Stock at Warehouse' }) },

  // Fuel Station
  { pattern: /^\/fuel\/station-master$/, meta: () => ({ title: 'Fuel Station Master', category: 'Fuel Station' }) },
  { pattern: /^\/fuel\/shift-master$/, meta: () => ({ title: 'Fuel Shift Master', category: 'Fuel Station' }) },
  { pattern: /^\/fuel\/receiving$/, meta: () => ({ title: 'Fuel Receiving', category: 'Fuel Station' }) },
  { pattern: /^\/fuel\/operations$/, meta: () => ({ title: 'Fuel Operations', category: 'Fuel Station' }) },
  { pattern: /^\/fuel\/reconciliation$/, meta: () => ({ title: 'Shift Reconciliation', category: 'Fuel Station' }) },
  { pattern: /^\/fuel\/shift-history$/, meta: () => ({ title: 'Fuel Shift History', category: 'Fuel Station' }) },
  { pattern: /^\/fuel\/sales-report$/, meta: () => ({ title: 'Fuel Sales Report', category: 'Fuel Station' }) },
  { pattern: /^\/fuel\/stock$/, meta: () => ({ title: 'Fuel Stock', category: 'Fuel Station' }) },
  { pattern: /^\/fuel\/nozzle$/, meta: () => ({ title: 'Fuel Nozzle', category: 'Fuel Station' }) },

  // Stock Management
  { pattern: /^\/stock\/ageing$/, meta: () => ({ title: 'Stock Ageing Analysis', category: 'Stock Management' }) },
  { pattern: /^\/stock\/counting$/, meta: () => ({ title: 'Stock Counting', category: 'Stock Management' }) },
  { pattern: /^\/stock\/transfer-request$/, meta: () => ({ title: 'Transfer Request', category: 'Stock Management' }) },
  { pattern: /^\/stock\/transfer$/, meta: () => ({ title: 'Inventory Transfer', category: 'Stock Management' }) },
  { pattern: /^\/stock\/receipt$/, meta: () => ({ title: 'Goods Receipt', category: 'Stock Management' }) },
  { pattern: /^\/stock\/issue$/, meta: () => ({ title: 'Goods Issue', category: 'Stock Management' }) },

  // Projects
  { pattern: /^\/projects\/manage$/, meta: () => ({ title: 'Project Management', category: 'Projects' }) },
  { pattern: /^\/projects\/analytics$/, meta: () => ({ title: 'Executive Analytics', category: 'Projects' }) },
  { pattern: /^\/projects\/finance$/, meta: () => ({ title: 'Stage Financial Progress', category: 'Projects' }) },

  // System & Admin
  { pattern: /^\/system\/approvals$/, meta: () => ({ title: 'Approver Management', category: 'System & Admin' }) },
  { pattern: /^\/system\/notes$/, meta: () => ({ title: 'Notes', category: 'System & Admin' }) },
  { pattern: /^\/system\/complaints$/, meta: () => ({ title: 'Complaints', category: 'System & Admin' }) },
  { pattern: /^\/system\/config\/document$/, meta: () => ({ title: 'Document Setting', category: 'Configuration' }) },
  { pattern: /^\/system\/config\/terms$/, meta: () => ({ title: 'Terms Conditions', category: 'Configuration' }) },
  { pattern: /^\/system\/config\/company$/, meta: () => ({ title: 'Company Details', category: 'Configuration' }) },
  { pattern: /^\/system\/config\/branch$/, meta: () => ({ title: 'Branch Setup', category: 'Configuration' }) },
  { pattern: /^\/system\/config\/workflow$/, meta: () => ({ title: 'Approval Workflow', category: 'Configuration' }) },
  { pattern: /^\/system\/config\/activity$/, meta: () => ({ title: 'Activity Log', category: 'Configuration' }) },
  { pattern: /^\/system\/config\/expenses$/, meta: () => ({ title: 'Expenses', category: 'Configuration' }) },
  { pattern: /^\/system\/config\/freight$/, meta: () => ({ title: 'Freight Charges', category: 'Configuration' }) },
  { pattern: /^\/system\/integration$/, meta: () => ({ title: 'Integration Monitor', category: 'System & Admin' }) },

  // Settings & Profile
  { pattern: /^\/settings\/general$/, meta: () => ({ title: 'General Settings', category: 'Settings' }) },
  { pattern: /^\/settings\/users$/, meta: () => ({ title: 'Users Management', category: 'Settings' }) },
  { pattern: /^\/settings\/roles$/, meta: () => ({ title: 'Roles & Permissions', category: 'Settings' }) },
  { pattern: /^\/settings$/, meta: () => ({ title: 'Settings', category: 'Settings' }) },
  { pattern: /^\/profile$/, meta: () => ({ title: 'User Profile', category: 'Account' }) },
  { pattern: /^\/tasks$/, meta: () => ({ title: 'Tasks', category: 'Workspace' }) },
  { pattern: /^\/analytics$/, meta: () => ({ title: 'Analytics Dashboard', category: 'Analytics' }) },
];

export const HeaderPageTitle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const routeMeta = useMemo((): RouteMeta => {
    // 1. Try explicit regex map
    for (const route of ROUTE_TITLE_MAP) {
      const match = pathname.match(route.pattern);
      if (match) {
        return route.meta(match);
      }
    }

    // 2. Try searching in NAVIGATION
    for (const item of NAVIGATION) {
      if (item.path && item.path === pathname) {
        return {
          title: t(item.translationKey, item.label),
        };
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.path && child.path === pathname) {
            return {
              title: t(child.translationKey, child.label),
              category: t(item.translationKey, item.label),
            };
          }
        }
      }
    }

    // 3. Fallback: Parse segments
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return { title: 'Dashboard' };

    const last = segments[segments.length - 1];
    const formatted = last
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    const category = segments.length > 1
      ? segments[0].replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : undefined;

    return { title: formatted, category };
  }, [pathname, t]);

  return (
    <div className={`flex flex-col justify-center min-w-0 ${className}`}>
      <div className="flex items-center gap-2">
        <h1 className="text-base sm:text-lg font-bold tracking-tight truncate leading-tight mb-0 text-slate-900 dark:text-white">
          {routeMeta.title}
        </h1>
      </div>
      {routeMeta.category && (
        <span className="text-[11px] font-medium hidden sm:block leading-none mt-0.5 text-slate-500 dark:text-slate-400 truncate">
          {routeMeta.category}
        </span>
      )}
    </div>
  );
};
