import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Target, Handshake, DollarSign, TrendingUp, CheckSquare, ArrowUpRight, ArrowDownRight, Plus, Phone, Mail, Calendar, FileText } from 'lucide-react';
import { Card } from '../../components/ui';
import { AreaChartWidget, BarChartWidget, PieChartWidget } from '../../components/charts';
import { MOCK_DASHBOARD_STATS } from '../../config/constants';
import { useLocaleStore } from '../../store/useLocaleStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, formatNumber, getRelativeTime } from '../../lib/formatters';
import { useNavigate } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const DashboardHome1: React.FC = () => {
  const { t } = useTranslation();
  const { currency } = useLocaleStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const stats = MOCK_DASHBOARD_STATS;

  const statCards = [
    { title: t('dashboard.totalContacts'), value: formatNumber(stats.totalContacts), icon: Users, change: '+12.5%', up: true, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    { title: t('dashboard.totalLeads'), value: formatNumber(stats.totalLeads), icon: Target, change: '+8.2%', up: true, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    { title: t('dashboard.totalDeals'), value: formatNumber(stats.totalDeals), icon: Handshake, change: '+15.3%', up: true, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { title: t('dashboard.totalRevenue'), value: formatCurrency(stats.totalRevenue, currency), icon: DollarSign, change: '+22.4%', up: true, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { title: t('dashboard.conversionRate'), value: `${stats.conversionRate}%`, icon: TrendingUp, change: '-2.1%', up: false, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { title: t('dashboard.openTasks'), value: stats.openTasks.toString(), icon: CheckSquare, change: '+5', up: false, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  ];

  const quickActions = [
    { label: t('dashboard.addContact'), icon: Plus, color: '#6366f1', onClick: () => navigate('/customers') },
    { label: t('dashboard.addLead'), icon: Target, color: '#ec4899', onClick: () => navigate('/leads') },
    { label: t('dashboard.addDeal'), icon: Handshake, color: '#10b981', onClick: () => navigate('/deals') },
    { label: t('dashboard.addTask'), icon: CheckSquare, color: '#f59e0b', onClick: () => navigate('/tasks') },
  ];

  const activityIcons: Record<string, React.ReactNode> = {
    call: <Phone className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    meeting: <Calendar className="h-4 w-4" />,
    note: <FileText className="h-4 w-4" />,
    task: <CheckSquare className="h-4 w-4" />,
  };

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text)' }}>{t('dashboard.title')}</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{t('common.welcome')}, {user?.firstName} {user?.lastName}</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card glass hover className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 font-display" style={{ color: 'var(--color-text)' }}>{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${stat.up ? 'text-success' : 'text-error'}`}>
                    {stat.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {stat.change}
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: stat.bg }}>
                  <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                </div>
              </div>
              {/* Decorative gradient */}
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10" style={{ background: stat.color }} />
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card glass className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{t('dashboard.revenueOverview')}</h3>
          </div>
          <AreaChartWidget data={stats.revenueByMonth} dataKey="revenue" xKey="month" height={280} />
        </Card>

        <Card glass>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text)' }}>{t('dashboard.leadsPipeline')}</h3>
          <PieChartWidget
            data={stats.leadsByStage.map((s) => ({ name: s.stage, value: s.count }))}
            height={280}
            innerRadius={50}
            outerRadius={90}
          />
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <Card glass>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text)' }}>{t('dashboard.quickActions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover:shadow-md"
                style={{ background: 'var(--color-surface-hover)', border: '1px solid var(--color-border)' }}
              >
                <div className="p-2.5 rounded-lg" style={{ background: `${action.color}15` }}>
                  <action.icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{action.label}</span>
              </motion.button>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card glass className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>{t('dashboard.recentActivity')}</h3>
          </div>
          <div className="space-y-3">
            {stats.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-hover/50 transition-colors">
                <div className="p-2 rounded-lg shrink-0" style={{ background: 'var(--color-primary)', color: 'white', opacity: 0.8 }}>
                  {activityIcons[activity.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{activity.description}</p>
                  )}
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>{getRelativeTime(activity.date)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="mt-4">
        <Card glass>
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text)' }}>{t('dashboard.topPerformers')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.topPerformers.map((performer, idx) => (
              <div key={performer.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--color-surface-hover)' }}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'][idx] }}>
                  #{idx + 1}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{performer.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{performer.deals} deals · {formatCurrency(performer.revenue, currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
