import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border border-line rounded-card ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-heading font-semibold text-ink-950 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-ink-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

