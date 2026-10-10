import { Home, PlusCircle, Search, LayoutDashboard } from 'lucide-react';

export interface MobileNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface MobileBottomNavProps {
  activeId: string;
  onChange: (id: string) => void;
  items?: MobileNavItem[];
}

const DEFAULT_MOBILE_ITEMS: MobileNavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'report', label: 'Report', icon: PlusCircle },
  { id: 'track', label: 'Track', icon: Search },
  { id: 'dashboard', label: 'Portal', icon: LayoutDashboard },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeId,
  onChange,
  items = DEFAULT_MOBILE_ITEMS,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-line shadow-soft flex items-center justify-around h-16 px-2"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors duration-150 ${
              isActive ? 'text-primary-700 font-semibold' : 'text-ink-500 hover:text-ink-950'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
            <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

