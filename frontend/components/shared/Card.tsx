import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={`bg-background border-2 border-primary rounded p-4 ${className}`}>
      {title && (
        <h3 className="text-secondary font-bold mb-3 text-sm border-b border-primary pb-2">
          {title}
        </h3>
      )}
      <div>{children}</div>
    </div>
  );
}
