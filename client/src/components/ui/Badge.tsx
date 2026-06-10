import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'info' | 'danger' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
  warning: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
  info: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
  danger: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30',
  default: 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-dark-300 border-gray-200 dark:border-dark-600',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

const Badge = React.memo(function Badge({
  variant = 'default',
  children,
  className = '',
  icon,
  size = 'md',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
});

export default Badge;
