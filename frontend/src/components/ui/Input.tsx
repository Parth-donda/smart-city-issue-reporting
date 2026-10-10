import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, id, className = '', disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-950">
            {label}
            {props.required && <span className="text-semantic-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-ink-500">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full bg-card text-ink-950 text-sm placeholder:text-ink-300 border rounded-input px-3.5 py-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:bg-surface disabled:text-ink-300 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error ? 'border-semantic-danger focus-visible:ring-semantic-danger' : 'border-line'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-ink-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-semantic-danger">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-ink-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

