import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({
  children,
}) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

  return (
    <div onClick={() => context.setOpen(!context.open)} className="cursor-pointer inline-flex">
      {children}
    </div>
  );
};

const DropdownMenuContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context || !context.open) return null;

  return (
    <div
      className={cn(
        'absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-xl ring-1 ring-black/5 animate-in fade-in-80 zoom-in-95',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  onSelect?: () => void;
  disabled?: boolean;
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  className,
  children,
  onSelect,
  disabled,
  ...props
}) => {
  const context = React.useContext(DropdownMenuContext);

  const handleClick = () => {
    if (disabled) return;
    onSelect?.();
    context?.setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-2 text-xs font-medium outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
};
