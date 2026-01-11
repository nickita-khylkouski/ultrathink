import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-bold rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-primary text-black hover:bg-secondary border border-primary',
    secondary: 'bg-accent text-black hover:bg-blue-400 border border-accent',
    danger: 'bg-danger text-white hover:bg-red-600 border border-danger',
    success: 'bg-green-600 text-white hover:bg-green-700 border border-green-600',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-live={loading ? 'polite' : undefined}
      {...props}
    >
      <span className="flex items-center justify-center">
        {loading && (
          <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        <span>{children}</span>
      </span>
      {loading && <span className="sr-only">Loading</span>}
    </button>
  );
}
