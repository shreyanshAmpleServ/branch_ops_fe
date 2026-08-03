import React from 'react';
import { AreaChart as RechartsArea, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey: string;
  color?: string;
  gradientColor?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

export const AreaChartWidget: React.FC<AreaChartProps> = ({
  data,
  dataKey,
  xKey,
  color = 'var(--color-primary)',
  height = 300,
  showGrid = true,
  className = '',
}) => {
  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsArea data={data}>
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
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#gradient-${dataKey})`} />
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
};
