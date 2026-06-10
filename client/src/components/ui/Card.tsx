import React from 'react';
import { motion } from 'framer-motion';

type CardVariant = 'glass' | 'solid' | 'gradient';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  padding?: string;
}

const variantClasses: Record<CardVariant, string> = {
  glass:
    'bg-white/70 dark:bg-dark-800/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20',
  solid:
    'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 shadow-lg shadow-black/5 dark:shadow-black/20',
  gradient:
    'bg-gradient-to-br from-primary-500/10 via-accent-500/5 to-primary-500/10 dark:from-primary-500/15 dark:via-accent-500/10 dark:to-primary-500/15 backdrop-blur-xl border border-primary-500/20 dark:border-primary-500/20 shadow-lg shadow-primary-500/5',
};

const Card = React.memo(function Card({
  variant = 'glass',
  children,
  className = '',
  hover = false,
  onClick,
  padding = 'p-6',
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      onClick={onClick}
      className={`
        rounded-2xl ${padding}
        ${variantClasses[variant]}
        ${hover ? 'cursor-pointer transition-shadow duration-300 hover:shadow-xl' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </motion.div>
  );
});

export default Card;
