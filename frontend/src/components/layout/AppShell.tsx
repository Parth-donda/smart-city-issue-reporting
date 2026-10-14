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
  CheckCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Inbox,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from '../../types/design-system';
import { NotificationItem } from '../../types/issues';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserProfileDropdown } from './UserProfileDropdown';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: number;
}

const getFallbackNavForRole = (role?: string): NavItem[] => {
  switch (role) {
    case 'CITIZEN':
      return [
        { id: 'citizen-dashboard', label: 'All My Grievances', icon: FileText },
        { id: 'report', label: 'File New Grievance', icon: Building2 },
        { id: 'track', label: 'Track Reference ID', icon: Clock },
        { id: 'home', label: 'Public Portal', icon: Inbox },
      ];
    case 'DEPARTMENT_OFFICER':
      return [
        { id: 'officer-dashboard', label: 'Command Triage Desk', icon: Inbox },
        { id: 'officer-new', label: 'New Intake (Pending)', icon: FileText },
        { id: 'officer-sla', label: 'SLA Breaches & Alerts', icon: AlertTriangle },
        { id: 'officer-assigned', label: 'Field Crew Dispatches', icon: Users },
        { id: 'officer-map', label: 'Ward GIS & Heatmap', icon: Building2 },
        { id: 'home', label: 'Public Portal', icon: Inbox },
      ];
    case 'WORKER':
      return [
        { id: 'worker-active', label: 'Active Work Orders', icon: Inbox },
        { id: 'worker-completed', label: 'Completed Repairs', icon: CheckCircle2 },
        { id: 'home', label: 'Public Portal', icon: Building2 },
      ];
    case 'SUPERVISOR':
      return [
        { id: 'supervisor-dashboard', label: 'Quality Verification Desk', icon: ShieldCheck },
        { id: 'home', label: 'Public Portal', icon: Building2 },
      ];
    case 'MUNICIPAL_ADMIN':
    case 'SYSTEM_ADMIN':
      return [
        { id: 'admin-issues', label: 'City Grievance Master', icon: FileText },
        { id: 'admin-map', label: 'GIS Hotspot Analysis', icon: Building2 },
        { id: 'admin-analytics', label: 'Citywide Analytics', icon: BarChart3 },
        { id: 'admin-routing', label: 'Automated Routing Engine', icon: Building2 },
        { id: 'admin-sla', label: 'Department SLA Matrix', icon: Clock },
        { id: 'admin-audit', label: 'Security & Audit Ledger', icon: ShieldCheck },
        { id: 'home', label: 'Public Portal', icon: Inbox },
      ];
    default:
      return [
        { id: 'home', label: 'Civic Home', icon: Inbox },
        { id: 'report', label: 'Report Civic Issue', icon: FileText },
        { id: 'track', label: 'Track Grievance Status', icon: Clock },
      ];
  }
};

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

export const AppShell: React.FC<AppShellProps> = ({
  children,
  userRole = 'Municipal Admin',
  userName = 'Admin User',
  activeNavId = 'issues',
  onNavigate,
  navItems,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const effectiveNavItems = (navItems && navItems.length > 0)
    ? navItems
    : getFallbackNavForRole(user?.role);

  const handleNavClick = (id: string) => {
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    // Fallback role-based direct routing
    switch (id) {
      case 'home': navigate('/'); break;
      case 'report': navigate('/report'); break;
      case 'track': navigate('/track'); break;
      case 'citizen-dashboard': navigate('/citizen'); break;
      case 'citizen-active': navigate('/citizen?tab=in_progress'); break;
      case 'citizen-resolved': navigate('/citizen?tab=resolved'); break;
      case 'officer-dashboard': navigate('/officer?view=queue&tab=all'); break;
      case 'officer-new': navigate('/officer?view=queue&tab=new_intake'); break;
      case 'officer-sla': navigate('/officer?view=queue&tab=sla_breached'); break;
      case 'officer-assigned': navigate('/officer?view=queue&tab=assigned'); break;
      case 'officer-map': navigate('/officer?view=map'); break;
      case 'worker-active': navigate('/worker?tab=active'); break;
      case 'worker-completed': navigate('/worker?tab=completed'); break;
      case 'supervisor-dashboard': navigate('/supervisor'); break;
      case 'admin-issues': navigate('/admin?tab=issues'); break;
      case 'admin-map': navigate('/admin?tab=map'); break;
      case 'admin-analytics': navigate('/admin?tab=analytics'); break;
      case 'admin-routing': navigate('/admin?tab=routing'); break;
      case 'admin-sla': navigate('/admin?tab=sla'); break;
      case 'admin-audit': navigate('/admin?tab=audit'); break;
      default: navigate('/'); break;
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const displayName = user ? (user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.username) : userName;
  const displayRole = user?.role || userRole;
  const userInitials = (displayName || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex bg-surface text-ink-950 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-line shrink-0 sticky top-0 h-screen z-30">
        {/* Brand / Logo */}
        <div className="h-16 px-6 border-b border-line flex items-center shrink-0">
          <div>
            <h1 className="font-heading font-bold text-lg tracking-tight text-ink-950">
              SmartCivic
            </h1>
            <p className="text-[11px] text-primary-700 uppercase tracking-wider font-bold truncate max-w-[190px]">
              {user?.role === 'CITIZEN'
                ? 'Citizen Portal'
                : user?.role === 'DEPARTMENT_OFFICER'
                ? (user.department_code ? `${user.department_code} Command` : 'Officer Command')
                : user?.role === 'WORKER'
                ? 'Field Crew Operations'
                : user?.role === 'SUPERVISOR'
                ? 'Field Quality Audit'
                : user?.role === 'MUNICIPAL_ADMIN' || user?.role === 'SYSTEM_ADMIN'
                ? 'Municipal Governance'
                : 'Civic Operations'}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {effectiveNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeNavId;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
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

          {/* Top Right Navbar: Notifications, User Profile & Sign Out Option */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Notification Bell & Popover */}
            <NotificationPopover />

            <div className="h-6 w-px bg-line" />

            {/* User Profile Menu & Sign Out Dropdown */}
            <UserProfileDropdown />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-ink-950/40"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="w-64 h-full bg-card border-r border-line p-4 space-y-3 flex flex-col"
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
                {effectiveNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavClick(item.id);
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

              {/* Mobile Drawer Bottom User & Sign Out */}
              <div className="pt-3 border-t border-line space-y-2">
                <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-surface border border-line">
                  <div className="w-8 h-8 rounded-full bg-primary-700/10 text-primary-700 flex items-center justify-center font-bold text-xs border border-primary-600/20 shrink-0">
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink-950 truncate">{displayName}</p>
                    <p className="text-[10px] text-ink-500 font-mono uppercase">{displayRole}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-button transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
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

