import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  Users,
  BarChart3,
  Bell,
  Menu,
  X,
  Shield,
  CheckCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Inbox
} from 'lucide-react';
import { UserRole } from '../../types/design-system';
import { NotificationItem } from '../../types/issues';
import { api } from '../../services/api';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: number;
}

const NotificationPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getUnreadNotificationCount();
      setUnreadCount(res.unread_count || 0);
    } catch {
      // ignore
    }
  };

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const items = await api.getNotifications();
      setNotifications(items);
      const count = items.filter(n => !n.is_read).length;
      setUnreadCount(count);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000); // 20s polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'WORKER_ASSIGNED':
        return <Users className="w-4 h-4 text-primary-600" />;
      case 'SLA_WARNING':
        return <AlertTriangle className="w-4 h-4 text-accent-500" />;
      case 'CLOSURE':
      case 'VERIFICATION_REQUEST':
        return <CheckCircle2 className="w-4 h-4 text-semantic-success" />;
      default:
        return <Clock className="w-4 h-4 text-status-under-review" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative p-2 text-ink-700 hover:bg-surface rounded-button transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-accent-500 text-ink-950 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-line rounded-card shadow-modal z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3.5 border-b border-line flex items-center justify-between bg-surface/50">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-ink-950">Notifications</span>
              {unreadCount > 0 && (
                <span className="font-mono text-[11px] px-2 py-0.2 bg-primary-100 text-primary-700 rounded-badge font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary-700 hover:text-primary-600 font-medium flex items-center gap-1 focus-visible:outline-none"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-line">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-ink-500 font-mono">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Inbox className="w-8 h-8 text-ink-300 mx-auto" />
                <p className="text-xs font-medium text-ink-700">No notifications yet</p>
                <p className="text-[11px] text-ink-500">Lifecycle updates and task orders will appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-surface/80 transition-colors cursor-pointer flex gap-3 text-left ${
                    !notif.is_read ? 'bg-primary-100/20' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0 p-2 rounded-button bg-surface border border-line flex items-center justify-center">
                    {getIconForType(notif.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs truncate ${!notif.is_read ? 'font-semibold text-ink-950' : 'font-medium text-ink-700'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-ink-500 font-mono shrink-0">{notif.time_ago}</span>
                    </div>
                    <p className="text-xs text-ink-500 line-clamp-2 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary-600 mt-2 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface AppShellProps {
  children: React.ReactNode;
  userRole?: UserRole;
  userName?: string;
  activeNavId?: string;
  onNavigate?: (id: string) => void;
  navItems?: NavItem[];
}

const DEFAULT_NAV: NavItem[] = [
  { id: 'issues', label: 'Issues & Reports', icon: FileText, badge: 12 },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'users', label: 'Team & Workers', icon: Users },
  { id: 'analytics', label: 'City Analytics', icon: BarChart3 },
];

export const AppShell: React.FC<AppShellProps> = ({
  children,
  userRole = 'Municipal Admin',
  userName = 'Admin User',
  activeNavId = 'issues',
  onNavigate,
  navItems = DEFAULT_NAV,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-surface text-ink-950 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-line shrink-0">
        {/* Brand / Logo */}
        <div className="h-16 px-6 border-b border-line flex items-center gap-3">
          <div className="w-8 h-8 rounded-button bg-primary-700 flex items-center justify-center text-card font-heading font-bold text-lg">
            S
          </div>
          <div>
            <h1 className="font-heading font-bold text-base tracking-tight text-ink-950">
              SmartCivic
            </h1>
            <p className="text-[11px] text-ink-500 uppercase tracking-wider font-medium">
              Civic Operations
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeNavId;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-button text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 font-semibold'
                    : 'text-ink-700 hover:bg-surface hover:text-ink-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-700' : 'text-ink-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-badge font-mono ${
                      isActive ? 'bg-primary-700 text-card' : 'bg-surface text-ink-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-line bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-700/10 text-primary-700 flex items-center justify-center font-semibold text-xs border border-line">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-950 truncate">{userName}</p>
              <div className="flex items-center gap-1 text-[11px] text-ink-500">
                <Shield className="w-3 h-3 text-primary-600" />
                <span className="truncate">{userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 bg-card border-b border-line flex items-center justify-between sticky top-0 z-30 shadow-soft">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-ink-700 hover:bg-surface rounded-button"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-mono uppercase text-ink-500">Workspace</span>
              <h2 className="text-sm font-semibold text-ink-950">City Command & Review Portal</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-surface border border-line rounded-badge text-xs">
              <span className="w-2 h-2 rounded-full bg-semantic-success" />
              <span className="text-ink-700 font-medium">System Online</span>
            </div>

            {/* Notification Bell & Popover */}
            <NotificationPopover />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-ink-950/40"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="w-64 h-full bg-card border-r border-line p-4 space-y-2 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <span className="font-heading font-bold text-base text-ink-950">SmartCivic</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-ink-500 hover:text-ink-950"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate?.(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-button text-sm font-medium ${
                      item.id === activeNavId
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-ink-700 hover:bg-surface'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="text-xs px-2 py-0.5 rounded-badge bg-surface font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};

