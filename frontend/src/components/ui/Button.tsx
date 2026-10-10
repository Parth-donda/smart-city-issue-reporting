import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex flex-row items-center justify-center font-medium transition-colors duration-150 rounded-button disabled:opacity-50 disabled:cursor-not-allowed select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 whitespace-nowrap cursor-pointer';

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-primary-700 text-card hover:bg-primary-800 active:bg-primary-900 shadow-soft',
      secondary:
        'bg-card text-ink-950 border border-line hover:bg-surface hover:border-ink-300 active:bg-line shadow-soft',
      outline:
        'bg-transparent text-ink-950 border border-line hover:bg-surface hover:border-ink-300 active:bg-line',
      ghost:
        'bg-transparent text-ink-700 hover:bg-surface hover:text-ink-950 active:bg-line',
      danger:
        'bg-semantic-danger text-card hover:bg-red-700 active:bg-red-800 shadow-soft',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5 h-12',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>}
        <span className="inline-flex items-center gap-2">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex shrink-0 items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

