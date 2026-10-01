import React, { useMemo } from 'react';
import { SearchableSelect, type SearchableSelectOption } from './SearchableSelect';
import {
  formatItemCatalogOption,
  renderItemOption,
  formatVendorOption,
  renderVendorOption,
  formatWarehouseOption,
  renderWarehouseOption,
  formatProjectOption,
  renderProjectOption,
  formatTaxCodeOption,
  renderTaxCodeOption,
  formatGLAccountOption,
  renderGLAccountOption,
  formatPaymentTermOption,
  renderPaymentTermOption,
  formatCostCenterOption,
  renderCostCenterOption,
  formatCustomerOption,
  renderCustomerOption,
  formatBranchOption,
  renderBranchOption,
  TAX_CODE_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
} from '../../features/procurement/procurementConstants';
import { useRetailers } from '../../features/customers/api/useRetailers';
import { useItems } from '../../features/items/api/useItems';
import {
  useWarehouses,
  useProjects,
  useAccounts,
  useCostCentersMain,
  useBranches,
} from '../../features/users/api/useMasterData';

export type CentralSelectType =
  | 'vendor'
  | 'customer'
  | 'item'
  | 'warehouse'
  | 'project'
  | 'tax'
  | 'account'
  | 'paymentTerms'
  | 'stage'
  | 'costCenter'
  | 'branch';

export interface CentralSelectBaseProps {
  value: string | number | undefined | null;
  onChange: (value: any, rawData?: any) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  clearable?: boolean;
  data?: any[]; // Pre-fetched data list (optional)
}

// ==========================================
// 1. VENDOR / SUPPLIER SELECT
// ==========================================
export interface VendorSelectProps extends CentralSelectBaseProps {}

export const VendorSelect: React.FC<VendorSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Search & select vendor by name, code or TIN...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const query = useRetailers(data ? undefined : { cardType: 'S', aprStatus: 'all' });
  const rawList = useMemo(() => {
    if (data) return data;
    const res = query.data as any;
    return (Array.isArray(res) ? res : res?.data) || [];
  }, [data, query.data]);

  const options = useMemo(() => rawList.map(formatVendorOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderVendorOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 2. ITEM CATALOG SELECT
// ==========================================
export interface ItemSelectProps extends CentralSelectBaseProps {}

export const ItemSelect: React.FC<ItemSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Search item by code, name or category...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const query = useItems(data ? undefined : { limit: 1000 });
  const rawList = useMemo(() => {
    if (data) return data;
    const res = query.data as any;
    return res?.items || (Array.isArray(res) ? res : res?.data) || [];
  }, [data, query.data]);

  const options = useMemo(() => rawList.map(formatItemCatalogOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderItemOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 3. WAREHOUSE SELECT
// ==========================================
export interface WarehouseSelectProps extends CentralSelectBaseProps {}

export const WarehouseSelect: React.FC<WarehouseSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Search & select warehouse...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const query = useWarehouses();
  const rawList = useMemo(() => {
    if (data) {
      if (Array.isArray(data)) return data;
      if (Array.isArray((data as any)?.warehouses)) return (data as any).warehouses;
      if (Array.isArray((data as any)?.data)) return (data as any).data;
      return [];
    }
    const res = query.data as any;
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.warehouses)) return res.warehouses;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  }, [data, query.data]);

  const options = useMemo(() => rawList.map(formatWarehouseOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderWarehouseOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 4. PROJECT SELECT
// ==========================================
export interface ProjectSelectProps extends CentralSelectBaseProps {}

export const ProjectSelect: React.FC<ProjectSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Search & select project...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const query = useProjects();
  const rawList = useMemo(() => {
    if (data) return data;
    const res = query.data as any;
    return (Array.isArray(res) ? res : res?.data) || [];
  }, [data, query.data]);

  const options = useMemo(() => rawList.map(formatProjectOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderProjectOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 5. TAX CODE SELECT
// ==========================================
export interface TaxSelectProps extends CentralSelectBaseProps {}

export const TaxSelect: React.FC<TaxSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Select tax code...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const rawList = data || TAX_CODE_OPTIONS;
  const options = useMemo(() => rawList.map(formatTaxCodeOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderTaxCodeOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 6. GL ACCOUNT SELECT
// ==========================================
export interface GLAccountSelectProps extends CentralSelectBaseProps {}

export const GLAccountSelect: React.FC<GLAccountSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Search & select GL account...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const query = useAccounts();
  const rawList = useMemo(() => {
    if (data) return data;
    const res = query.data as any;
    return (Array.isArray(res) ? res : res?.data) || [];
  }, [data, query.data]);

  const options = useMemo(() => rawList.map(formatGLAccountOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderGLAccountOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 7. PAYMENT TERMS SELECT
// ==========================================
export interface PaymentTermsSelectProps extends CentralSelectBaseProps {}

export const PaymentTermsSelect: React.FC<PaymentTermsSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Select payment terms...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const rawList = data || PAYMENT_TERMS_OPTIONS;
  const options = useMemo(() => rawList.map(formatPaymentTermOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderPaymentTermOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 8. PROJECT STAGES / COST CENTERS SELECT
// ==========================================
export interface StageSelectProps extends CentralSelectBaseProps {
  dimCode?: number; // 1: Project Stage, 2: Project Sub Stage, 3: Detail Sub Stage, 4: More Detail Sub Stage
}

export const StageSelect: React.FC<StageSelectProps> = ({
  dimCode,
  data,
  value,
  onChange,
  label,
  placeholder,
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const query = useCostCentersMain();
  const rawList = useMemo(() => {
    const list = data || ((Array.isArray(query.data) ? query.data : (query.data as any)?.data) || []);
    if (dimCode !== undefined) {
      return list.filter((cc: any) => cc.dimCode === dimCode);
    }
    return list;
  }, [data, query.data, dimCode]);

  const defaultPlaceholder = useMemo(() => {
    switch (dimCode) {
      case 1:
        return 'Select Project Stage...';
      case 2:
        return 'Select Sub Stage...';
      case 3:
        return 'Select Detail Sub Stage...';
      case 4:
        return 'Select More Detail Stage...';
      default:
        return 'Select Stage...';
    }
  }, [dimCode]);

  const options = useMemo(() => rawList.map(formatCostCenterOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderCostCenterOption}
      placeholder={placeholder || defaultPlaceholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 9. COST CENTER SELECT
// ==========================================
export interface CostCenterSelectProps extends CentralSelectBaseProps {}

export const CostCenterSelect: React.FC<CostCenterSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Select Cost Center...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const query = useCostCentersMain();
  const rawList = useMemo(() => {
    if (data) return data;
    const res = query.data as any;
    return (Array.isArray(res) ? res : res?.data) || [];
  }, [data, query.data]);

  const options = useMemo(() => rawList.map(formatCostCenterOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderCostCenterOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 10. CUSTOMER SELECT
// ==========================================
export interface CustomerSelectProps extends CentralSelectBaseProps {}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Search & select customer by name, code or TIN...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const query = useRetailers(data ? undefined : { cardType: 'C', aprStatus: 'all' });
  const rawList = useMemo(() => {
    if (data) return data;
    const res = query.data as any;
    return (Array.isArray(res) ? res : res?.data) || [];
  }, [data, query.data]);

  const options = useMemo(() => rawList.map(formatCustomerOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderCustomerOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// 11. BRANCH SELECT
// ==========================================
export interface BranchSelectProps extends CentralSelectBaseProps {}

export const BranchSelect: React.FC<BranchSelectProps> = ({
  data,
  value,
  onChange,
  label,
  placeholder = 'Search & select branch...',
  disabled,
  className,
  inputClassName,
  size = 'md',
  fullWidth = true,
  clearable = true,
}) => {
  const query = useBranches();
  const rawList = useMemo(() => {
    if (data) return data;
    const res = query.data as any;
    return (Array.isArray(res) ? res : res?.data) || [];
  }, [data, query.data]);

  const options = useMemo(() => rawList.map(formatBranchOption), [rawList]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(val, opt) => onChange(val, opt?.raw)}
      options={options}
      renderOption={renderBranchOption}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      inputClassName={inputClassName}
      size={size}
      fullWidth={fullWidth}
      clearable={clearable}
    />
  );
};

// ==========================================
// UNIFIED MASTER DISPATCHER: CentralSelect
// ==========================================
export interface CentralSelectProps extends CentralSelectBaseProps {
  type: CentralSelectType;
  dimCode?: number;
}

/**
 * Single centralized select component usable across the entire application.
 * Usage: <CentralSelect type="vendor" value={val} onChange={setVal} />
 */
export const CentralSelect: React.FC<CentralSelectProps> = ({ type, ...props }) => {
  switch (type) {
    case 'vendor':
      return <VendorSelect {...props} />;
    case 'customer':
      return <CustomerSelect {...props} />;
    case 'item':
      return <ItemSelect {...props} />;
    case 'warehouse':
      return <WarehouseSelect {...props} />;
    case 'project':
      return <ProjectSelect {...props} />;
    case 'tax':
      return <TaxSelect {...props} />;
    case 'account':
      return <GLAccountSelect {...props} />;
    case 'paymentTerms':
      return <PaymentTermsSelect {...props} />;
    case 'stage':
      return <StageSelect dimCode={props.dimCode ?? 1} {...props} />;
    case 'costCenter':
      return <CostCenterSelect {...props} />;
    case 'branch':
      return <BranchSelect {...props} />;
    default:
      return null;
  }
};

