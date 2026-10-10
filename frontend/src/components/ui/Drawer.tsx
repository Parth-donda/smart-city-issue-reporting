import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-ink-950/40 transition-opacity duration-150"
      onClick={onClose}
    >
      <div
        className={`w-full ${widths[width]} h-full bg-card border-l border-line shadow-modal flex flex-col transition-transform duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-line shrink-0">
          <div>
            {title && <h3 className="text-lg font-heading font-semibold text-ink-950">{title}</h3>}
            {description && <p className="text-xs text-ink-500 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1 text-ink-500 hover:text-ink-950 rounded-button transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {footer && (
          <div className="p-4 bg-surface border-t border-line flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

