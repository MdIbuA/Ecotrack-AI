import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiActivity, FiTrendingDown, FiCalendar, FiStar,
  FiPlusCircle, FiCpu,
} from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  Legend, Area, AreaChart,
} from 'recharts';
import Layout from '../components/layout/Layout';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ProgressBar from '../components/ui/ProgressBar';
import { useAuth } from '../context/AuthContext';
import { useCarbon } from '../context/CarbonContext';
import { useTheme } from '../context/ThemeContext';

const mockTrendData = [
  { date: 'Jun 1', emissions: 12.5 },
  { date: 'Jun 2', emissions: 10.8 },
  { date: 'Jun 3', emissions: 15.2 },
  { date: 'Jun 4', emissions: 8.9 },
  { date: 'Jun 5', emissions: 11.3 },
  { date: 'Jun 6', emissions: 9.7 },
  { date: 'Jun 7', emissions: 13.1 },
  { date: 'Jun 8', emissions: 7.5 },
  { date: 'Jun 9', emissions: 10.2 },
  { date: 'Jun 10', emissions: 8.1 },
];

const mockCategoryData = [
  { name: 'Transportation', value: 42, color: '#00d97e' },
  { name: 'Energy', value: 28, color: '#7c3aed' },
  { name: 'Food', value: 20, color: '#f59e0b' },
  { name: 'Waste', value: 10, color: '#64748b' },
];

const mockWeeklyData = [
  { week: 'Week 1', current: 85, previous: 92 },
  { week: 'Week 2', current: 78, previous: 85 },
  { week: 'Week 3', current: 72, previous: 78 },
  { week: 'Week 4', current: 65, previous: 72 },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-800 px-4 py-3 rounded-xl shadow-xl border border-gray-200 dark:border-dark-700">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value} kg
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, goals } = useCarbon();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const activeGoals = goals.filter((g) => g.status === 'active');
  const totalEmissions = mockCategoryData.reduce((sum, d) => sum + d.value, 0);
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <Layout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.displayName || 'Eco Hero'}! 🌱
            </h1>
            <p className="text-gray-500 dark:text-dark-400 mt-1">
              Here&apos;s your environmental impact summary
            </p>
          </div>
          <Badge variant="success" size="md" icon={<FiStar className="w-4 h-4" />}>
            Level 5 • Eco Warrior
          </Badge>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total CO₂"
            value="156.2"
            suffix="kg"
            icon={<FiActivity className="w-5 h-5" />}
            trend={-8}
            trendLabel="vs last month"
            delay={0}
          />
          <StatCard
            label="Daily Average"
            value="5.2"
            suffix="kg"
            icon={<FiTrendingDown className="w-5 h-5" />}
            trend={-12}
            trendLabel="improvement"
            delay={0.1}
          />
          <StatCard
            label="This Week"
            value="36.4"
            suffix="kg"
            icon={<FiCalendar className="w-5 h-5" />}
            trend={-5}
            trendLabel="vs last week"
            delay={0.2}
          />
          <StatCard
            label="Eco Points"
            value="1,250"
            icon={<FiStar className="w-5 h-5" />}
            delay={0.3}
          />
        </motion.div>

        {/* Charts Row */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emission Trends - Area Chart */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Emission Trends</h3>
              <Badge variant="info" size="sm">Last 10 days</Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d97e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d97e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                  <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    stroke="#00d97e"
                    strokeWidth={2.5}
                    fill="url(#emissionsGradient)"
                    name="Emissions"
                    dot={{ fill: '#00d97e', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#00d97e', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Emissions by Category - Donut Chart */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Emissions by Category</h3>
              <Badge variant="default" size="sm">This month</Badge>
            </div>
            <div className="h-72 flex items-center">
              <div className="w-1/2 h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {mockCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value}%`, '']}
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#fff',
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        padding: '8px 12px',
                      }}
                      itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalEmissions}</p>
                    <p className="text-xs text-gray-500 dark:text-dark-400">kg CO₂</p>
                  </div>
                </div>
              </div>
              <div className="w-1/2 space-y-3 pl-4">
                {mockCategoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-dark-300 truncate">{cat.name}</p>
                      <p className="text-xs text-gray-500 dark:text-dark-400">{cat.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Weekly Comparison - Bar Chart */}
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weekly Comparison</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-sm text-gray-500 dark:text-dark-400">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-500/40" />
                  <span className="text-sm text-gray-500 dark:text-dark-400">Previous</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockWeeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="week" tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                  <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="current" fill="#00d97e" radius={[6, 6, 0, 0]} name="Current" maxBarSize={40} />
                  <Bar dataKey="previous" fill={isDark ? 'rgba(124, 58, 237, 0.35)' : 'rgba(124, 58, 237, 0.4)'} radius={[6, 6, 0, 0]} name="Previous" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Bottom Row */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Goals */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Goals</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate('/goals')}>
                View all
              </Button>
            </div>
            {activeGoals.length > 0 ? (
              <div className="space-y-4">
                 {activeGoals.slice(0, 3).map((goal) => {
                    const progress = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700 dark:text-dark-300">{goal.title}</p>
                          <Badge
                            variant={goal.category === 'transportation' ? 'success' : goal.category === 'energy' ? 'info' : 'warning'}
                            size="sm"
                          >
                            {goal.category}
                          </Badge>
                        </div>
                        <ProgressBar
                          value={progress}
                          size="sm"
                          color={progress >= 80 ? 'primary' : progress >= 50 ? 'accent' : 'warning'}
                        />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-dark-400 text-sm mb-3">No active goals yet</p>
                <Button size="sm" onClick={() => navigate('/goals')}>
                  Create Goal
                </Button>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/calculator')}
                className="flex items-center gap-3 p-4 rounded-xl bg-primary-500/10 dark:bg-primary-500/15 border border-primary-500/20 hover:border-primary-500/40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <FiPlusCircle className="w-5 h-5 text-primary-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Log Entry</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Track emissions</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/ai-coach')}
                className="flex items-center gap-3 p-4 rounded-xl bg-accent-500/10 dark:bg-accent-500/15 border border-accent-500/20 hover:border-accent-500/40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center">
                  <FiCpu className="w-5 h-5 text-accent-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Get AI Tips</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Reduce footprint</p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/receipt-scanner')}
                className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <span className="text-lg">📷</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Scan Receipt</p>
                  <p className="text-xs text-gray-500 dark:text-dark-400">Analyze shopping</p>
                </div>
              </motion.button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
