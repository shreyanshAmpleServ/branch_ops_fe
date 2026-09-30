import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface TableSkeletonLoaderProps {
  columnsCount?: number;
  rowsCount?: number;
  viewMode?: 'table' | 'grid';
  message?: string;
}

export const TableSkeletonLoader: React.FC<TableSkeletonLoaderProps> = ({
  columnsCount = 6,
  rowsCount = 7,
  viewMode = 'table',
  message = 'Loading data records...',
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="p-4 space-y-4 w-full">
        {/* Top Progress Line */}
        <div className="relative w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500 to-indigo-500 animate-[shimmer_1.5s_infinite] -translate-x-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-3 relative overflow-hidden animate-pulse"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              {/* Shimmer gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-slate-700/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

              {/* Card Header Skeleton */}
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-md w-1/2" />
                </div>
                <div className="w-14 h-5 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0" />
              </div>

              {/* Card Body Skeleton */}
              <div className="space-y-2.5 py-1">
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-14" />
                  <div className="h-4 bg-teal-100/60 dark:bg-teal-950/40 rounded w-28" />
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-20" />
                <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Realistic random widths for column cells to look natural
  const colWidths = ['w-24', 'w-44', 'w-32', 'w-28', 'w-36', 'w-20', 'w-16'];

  return (
    <div className="w-full relative overflow-hidden">
      {/* Top Indeterminate Progress Line */}
      <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
        <div className="absolute inset-y-0 bg-gradient-to-r from-transparent via-teal-500 to-indigo-500 animate-[shimmer_1.5s_infinite] w-full" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Skeleton Table Header */}
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/40">
              <th className="py-3 px-4 w-10">
                <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </th>
              {[...Array(columnsCount)].map((_, i) => (
                <th key={i} className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-3 bg-slate-200 dark:bg-slate-700 rounded-md ${colWidths[i % colWidths.length]} animate-pulse`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                    <div className="w-3 h-3 rounded bg-slate-200/60 dark:bg-slate-700/60 shrink-0" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Skeleton Table Body Rows */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {[...Array(rowsCount)].map((_, rowIndex) => {
              const isEven = rowIndex % 2 === 0;
              return (
                <tr
                  key={rowIndex}
                  className={`${isEven ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/40 dark:bg-slate-800/50'} transition-colors relative group`}
                >
                  {/* Selection checkbox */}
                  <td className="py-3.5 px-4">
                    <div className="w-4 h-4 rounded bg-slate-200/80 dark:bg-slate-700/80 animate-pulse" />
                  </td>

                  {/* Dynamic Column Cells */}
                  {[...Array(columnsCount)].map((_, colIndex) => {
                    const isFirst = colIndex === 0;
                    const isLast = colIndex === columnsCount - 1;
                    const isSecondToLast = colIndex === columnsCount - 2;

                    return (
                      <td key={colIndex} className="py-3.5 px-4">
                        {isFirst ? (
                          // Code / ID + subtext
                          <div className="space-y-1.5">
                            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md w-28 animate-pulse" />
                            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-md w-16 animate-pulse" />
                          </div>
                        ) : isLast ? (
                          // Action buttons pill
                          <div className="flex items-center gap-1.5 justify-end">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/70 animate-pulse" />
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/70 animate-pulse" />
                          </div>
                        ) : isSecondToLast ? (
                          // Status Badge Skeleton
                          <div className="w-20 h-5 rounded-full bg-slate-200/70 dark:bg-slate-700/70 animate-pulse" />
                        ) : (
                          // General Text Cell
                          <div
                            className={`h-3 bg-slate-200/80 dark:bg-slate-700/80 rounded-md ${
                              colWidths[(colIndex + rowIndex) % colWidths.length]
                            } animate-pulse`}
                            style={{ animationDelay: `${(rowIndex * 50 + colIndex * 30)}ms` }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Sleek Floating Status Indicator */}
      <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
          </div>
          <span className="font-medium text-[11px] tracking-wide">{message}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600 dark:text-teal-400" />
          <span>Synchronizing...</span>
        </div>
      </div>
    </div>
  );
};
