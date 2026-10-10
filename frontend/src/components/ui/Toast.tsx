import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastProps {
  id: string;
  type?: ToastType;
  title: string;
  message?: string;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  onDismiss,
}) => {
  const configs = {
    success: {
      border: 'border-semantic-success',
      icon: CheckCircle2,
      iconColor: 'text-semantic-success',
    },
    warning: {
      border: 'border-semantic-warning',
      icon: AlertTriangle,
      iconColor: 'text-semantic-warning',
    },
    danger: {
      border: 'border-semantic-danger',
      icon: AlertCircle,
      iconColor: 'text-semantic-danger',
    },
    info: {
      border: 'border-semantic-info',
      icon: Info,
      iconColor: 'text-semantic-info',
    },
  };

  const current = configs[type];
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 bg-card border-l-4 ${current.border} border-y border-r border-line rounded-input shadow-soft max-w-sm w-full transition-all duration-150`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${current.iconColor} mt-0.5`} />
      <div className="flex-1 text-left">
        <h4 className="text-sm font-semibold text-ink-950">{title}</h4>
        {message && <p className="text-xs text-ink-500 mt-0.5">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="p-1 text-ink-300 hover:text-ink-700 rounded-button transition-colors duration-150"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

