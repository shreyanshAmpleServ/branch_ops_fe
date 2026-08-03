import React from 'react';
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LineChartProps {
  data: Record<string, unknown>[];
  lines: { dataKey: string; color: string; name?: string }[];
  xKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export const LineChartWidget: React.FC<LineChartProps> = ({
  data,
  lines,
  xKey,
  height = 300,
  showGrid = true,
  showLegend = false,
  className = '',
}) => {
  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsLine data={data}>
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
          {showLegend && <Legend />}
          {lines.map((line) => (
            <Line key={line.dataKey} type="monotone" dataKey={line.dataKey} stroke={line.color} strokeWidth={2.5} dot={{ r: 4 }} name={line.name || line.dataKey} />
          ))}
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
};
