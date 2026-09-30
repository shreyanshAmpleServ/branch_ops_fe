import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DesignId } from '../types/theme.types';
import type { TableDesignVariant, TableLibrary } from '../types/table.types';

interface DesignStore {
  activeDesign: DesignId;
  tableDesign: TableDesignVariant;
  setActiveDesign: (design: DesignId) => void;
  setTableDesign: (design: TableDesignVariant) => void;
}

export const useDesignStore = create<DesignStore>()(
  persist(
    (set) => ({
      activeDesign: 'design1',
      tableDesign: 'modern',
      setActiveDesign: (activeDesign) => set({ activeDesign }),
      setTableDesign: (tableDesign) => set({ tableDesign }),
    }),
    { name: 'salesapp-design' }
  )
);
