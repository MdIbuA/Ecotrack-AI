import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import Card from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  className?: string;
  delay?: number;
}

const StatCard = React.memo(function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  suffix,
  className = '',
  delay = 0,
}: StatCardProps) {
  const isPositiveTrend = trend !== undefined && trend >= 0;
  // For carbon footprint, negative trend (reduction) is good
  const trendIsGood = trend !== undefined && trend <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={`relative overflow-hidden ${className}`} hover>
        {/* Subtle gradient accent */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/10 to-accent-500/10 -translate-y-8 translate-x-8" />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-dark-400 mb-1">
                {label}
              </p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {value}
                </h3>
                {suffix && (
                  <span className="text-sm text-gray-500 dark:text-dark-400">
                    {suffix}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-500/10 text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          </div>

          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-3">
              <div
                className={`flex items-center gap-0.5 text-sm font-medium ${
                  trendIsGood
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-500 dark:text-red-400'
                }`}
              >
                {isPositiveTrend ? (
                  <FiTrendingUp className="w-4 h-4" />
                ) : (
                  <FiTrendingDown className="w-4 h-4" />
                )}
                <span>{Math.abs(trend)}%</span>
              </div>
              {trendLabel && (
                <span className="text-xs text-gray-500 dark:text-dark-400">
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
});

export default StatCard;
