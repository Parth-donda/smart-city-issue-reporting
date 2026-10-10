import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-line flex gap-2 sm:gap-6 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
              isActive
                ? 'border-primary-600 text-primary-700 font-semibold'
                : 'border-transparent text-ink-500 hover:text-ink-950 hover:border-ink-300'
            }`}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-2 py-0.5 rounded-badge ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-surface text-ink-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

