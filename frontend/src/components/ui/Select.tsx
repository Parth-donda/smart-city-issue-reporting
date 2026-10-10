import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, id, className = '', disabled, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-ink-950">
            {label}
            {props.required && <span className="text-semantic-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full appearance-none bg-card text-ink-950 text-sm border rounded-input px-3.5 py-2 pr-10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:bg-surface disabled:text-ink-300 disabled:cursor-not-allowed ${
              error ? 'border-semantic-danger focus-visible:ring-semantic-danger' : 'border-line'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 pointer-events-none text-ink-500">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';

