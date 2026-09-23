import React from 'react';
import { useWarehouses } from '../../features/warehouse/api/useWarehouse';

interface WarehousePickerProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  className?: string;
}

const WarehousePicker: React.FC<WarehousePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { data: warehousesData, isLoading } = useWarehouses();

  const warehousesList = warehousesData?.warehouses ?? [];

  return (
    <select
      value={value ?? ''}
      onChange={(e) =>
        onChange(e.target.value ? Number(e.target.value) : null)
      }
      disabled={isLoading}
      className={`w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 ${className}`}
    >
      <option value="">
        {isLoading ? 'Loading Warehouses...' : '-- Select Warehouse --'}
      </option>

      {warehousesList.map((wh: any) => (
        <option key={wh.id} value={wh.id}>
          {wh.name || wh.code}
        </option>
      ))}
    </select>
  );
};

export default WarehousePicker;