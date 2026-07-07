import React from 'react';
import { AppCard } from '@/shared/ui/index';
import { cn } from '@/shared/lib/cn';

interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: any;
}

export const Card: React.FC<CardProps> = ({ children, padding = 'md', className, style }) => {
  const padClass = padding === 'none' ? '' : padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-5' : 'p-4';
  return (
    <AppCard noPadding={padding === 'none'} style={style} className={cn(padClass, className)}>
      {children}
    </AppCard>
  );
};
