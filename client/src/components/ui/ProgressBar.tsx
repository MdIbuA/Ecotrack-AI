import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  target?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'accent' | 'warning' | 'danger';
  className?: string;
  animated?: boolean;
}

const colorClasses = {
  primary: 'from-primary-400 to-primary-600',
  accent: 'from-accent-400 to-accent-600',
  warning: 'from-amber-400 to-amber-600',
  danger: 'from-red-400 to-red-600',
};

const bgClasses = {
  primary: 'bg-primary-100 dark:bg-primary-900/30',
  accent: 'bg-accent-100 dark:bg-accent-900/30',
  warning: 'bg-amber-100 dark:bg-amber-900/30',
  danger: 'bg-red-100 dark:bg-red-900/30',
};

const sizeMap = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  target,
  size = 'md',
  color = 'primary',
  className = '',
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const targetPercentage = target ? Math.min(Math.round((target / max) * 100), 100) : null;

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-dark-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-600 dark:text-dark-400">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div
        className={`relative w-full ${sizeMap[size]} rounded-full ${bgClasses[color]} overflow-hidden`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${percentage}%`}
      >
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colorClasses[color]}`}
        />
        {targetPercentage !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-500 dark:bg-gray-300"
            style={{ left: `${targetPercentage}%` }}
            title={`Target: ${target}`}
          />
        )}
      </div>
    </div>
  );
}

export default React.memo(ProgressBar);
