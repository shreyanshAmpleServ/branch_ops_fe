import React from 'react';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
  barRadius?: number;
}

export const BarChartWidget: React.FC<BarChartProps> = ({
  data,
  dataKey,
  xKey,
  color = 'var(--color-primary)',
  height = 300,
  showGrid = true,
  barRadius = 8,
  className = '',
}) => {
  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsBar data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
          <XAxis dataKey={xKey} tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-border)' }} />
          <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-border)' }} />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              color: 'var(--color-text)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[barRadius, barRadius, 0, 0]} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
};
