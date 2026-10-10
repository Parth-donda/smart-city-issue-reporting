import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
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

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-ink-950/50 backdrop-blur-xs transition-opacity duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidths[maxWidth]} max-h-[88vh] flex flex-col bg-card rounded-card border border-line shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-line shrink-0">
          <div>
            {title && <h3 className="text-lg font-heading font-semibold text-ink-950">{title}</h3>}
            {description && <p className="text-xs text-ink-500 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-ink-500 hover:text-ink-950 rounded-button transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain min-h-0">{children}</div>

        {footer && (
          <div className="p-4 bg-surface border-t border-line flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

