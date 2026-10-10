import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, id, className = '', disabled, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-ink-950">
            {label}
            {props.required && <span className="text-semantic-danger ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          rows={rows}
          className={`w-full bg-card text-ink-950 text-sm placeholder:text-ink-300 border rounded-input px-3.5 py-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:bg-surface disabled:text-ink-300 disabled:cursor-not-allowed resize-y ${
            error ? 'border-semantic-danger focus-visible:ring-semantic-danger' : 'border-line'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-semantic-danger">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-ink-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

