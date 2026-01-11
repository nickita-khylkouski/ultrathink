import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'good' | 'bad' | 'warn' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
  const variantStyles = {
    good: 'bg-green-900/50 text-primary border-primary',
    bad: 'bg-red-900/50 text-danger border-danger',
    warn: 'bg-yellow-900/50 text-warning border-warning',
    info: 'bg-blue-900/50 text-accent border-accent',
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium border rounded ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
