import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />
      {/* Side sheet drawer */}
      <div className="relative z-50 h-full w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-200">
        {children}
      </div>
    </div>
  );
};

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 space-y-6', className)} {...props}>
    {onClose && (
      <button
        onClick={onClose}
        className="absolute right-5 top-5 rounded-md p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </button>
    )}
    {children}
  </div>
));
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-left border-b border-slate-100 pb-4', className)}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-bold tracking-tight text-slate-900', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-slate-500', className)}
    {...props}
  />
));
SheetDescription.displayName = 'SheetDescription';

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
