import React from 'react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PieChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  className?: string;
}

const DEFAULT_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'];

export const PieChartWidget: React.FC<PieChartProps> = ({
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
  className = '',
}) => {
  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsPie>
          <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={3} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              color: 'var(--color-text)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          />
          {showLegend && <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} />}
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
};
