import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui';
import { AreaChartWidget, BarChartWidget, PieChartWidget, LineChartWidget } from '../../components/charts';
import { MOCK_DASHBOARD_STATS } from '../../config/constants';
import { useLocaleStore } from '../../store/useLocaleStore';
import { formatCurrency } from '../../lib/formatters';

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { currency } = useLocaleStore();
  const stats = MOCK_DASHBOARD_STATS;

  const funnelData = [
    { stage: 'Leads', value: 356, color: '#6366f1' },
    { stage: 'Qualified', value: 180, color: '#8b5cf6' },
    { stage: 'Proposals', value: 85, color: '#ec4899' },
    { stage: 'Negotiation', value: 42, color: '#f59e0b' },
    { stage: 'Won', value: 28, color: '#10b981' },
  ];

  return (
    <div className="page-container">
      <h1 className="text-xl font-bold mb-5" style={{ color: 'var(--color-text)' }}>{t('analytics.title')}</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('analytics.monthlyRevenue'), value: formatCurrency(340000, currency), sub: '+18% vs last month', color: '#6366f1' },
          { label: t('analytics.leadConversion'), value: '24.8%', sub: '+2.3% vs last month', color: '#10b981' },
          { label: t('analytics.dealWinRate'), value: '67%', sub: '+5% vs last quarter', color: '#ec4899' },
          { label: t('analytics.avgDealSize'), value: formatCurrency(52000, currency), sub: '+12% vs last month', color: '#f59e0b' },
        ].map(kpi => (
          <Card key={kpi.label} hover>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>{kpi.label}</p>
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs mt-1 text-success">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('analytics.monthlyRevenue')}</h3>
          <AreaChartWidget data={stats.revenueByMonth} dataKey="revenue" xKey="month" height={300} />
        </Card>
        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('analytics.salesFunnel')}</h3>
          <div className="space-y-3 py-4">
            {funnelData.map((item, idx) => (
              <div key={item.stage} className="flex items-center gap-3">
                <span className="text-xs font-medium w-24" style={{ color: 'var(--color-text)' }}>{item.stage}</span>
                <div className="flex-1 h-8 rounded-lg relative overflow-hidden" style={{ background: 'var(--color-surface-hover)' }}>
                  <div className="h-full rounded-lg flex items-center px-3 transition-all duration-500" style={{ width: `${(item.value / funnelData[0].value) * 100}%`, background: item.color }}>
                    <span className="text-xs font-bold text-white">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('dashboard.leadsPipeline')}</h3>
          <PieChartWidget data={stats.leadsByStage.map(s => ({ name: s.stage, value: s.count }))} height={280} />
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>{t('analytics.teamPerformance')}</h3>
          <BarChartWidget data={stats.topPerformers.map(p => ({ name: p.name.split(' ')[0], revenue: p.revenue, deals: p.deals * 10000 }))} dataKey="revenue" xKey="name" height={280} color="#8b5cf6" />
        </Card>
      </div>
    </div>
  );
};
