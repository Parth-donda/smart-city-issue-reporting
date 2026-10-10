import React from 'react';
import {
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  UserCheck,
  Navigation,
  MapPin,
  Wrench,
  PlayCircle,
  CheckCheck,
  ShieldCheck,
  Archive,
  RotateCcw,
  ArrowDown,
  Minus,
  ArrowUp,
  AlertTriangle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { IssueStatus, IssuePriority, ConfidenceBand } from '../../types/design-system';

// Status Badge Definitions
interface StatusConfig {
  label: string;
  color: string;
  bgTint: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STATUS_MAP: Record<IssueStatus, StatusConfig> = {
  SUBMITTED: {
    label: 'Submitted',
    color: '#64748B',
    bgTint: 'rgba(100, 116, 139, 0.12)',
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    color: '#2F6FDE',
    bgTint: 'rgba(47, 111, 222, 0.12)',
    icon: Eye,
  },
  ACCEPTED: {
    label: 'Accepted',
    color: '#0E7378',
    bgTint: 'rgba(14, 115, 120, 0.12)',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejected',
    color: '#C2410C',
    bgTint: 'rgba(194, 65, 12, 0.12)',
    icon: XCircle,
  },
  ASSIGNED: {
    label: 'Assigned',
    color: '#0369A1',
    bgTint: 'rgba(3, 105, 161, 0.12)',
    icon: UserCheck,
  },
  ON_THE_WAY: {
    label: 'On The Way',
    color: '#B45309',
    bgTint: 'rgba(180, 83, 9, 0.12)',
    icon: Navigation,
  },
  ARRIVED: {
    label: 'Arrived',
    color: '#B45309',
    bgTint: 'rgba(180, 83, 9, 0.12)',
    icon: MapPin,
  },
  WORK_STARTED: {
    label: 'Work Started',
    color: '#A16207',
    bgTint: 'rgba(161, 98, 7, 0.12)',
    icon: Wrench,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#A16207',
    bgTint: 'rgba(161, 98, 7, 0.12)',
    icon: PlayCircle,
  },
  DONE: {
    label: 'Done',
    color: '#4D7C0F',
    bgTint: 'rgba(77, 124, 15, 0.12)',
    icon: CheckCheck,
  },
  VERIFIED: {
    label: 'Verified',
    color: '#15803D',
    bgTint: 'rgba(21, 128, 61, 0.12)',
    icon: ShieldCheck,
  },
  CLOSED: {
    label: 'Closed',
    color: '#475569',
    bgTint: 'rgba(71, 85, 105, 0.12)',
    icon: Archive,
  },
  REOPENED: {
    label: 'Reopened',
    color: '#BE123C',
    bgTint: 'rgba(190, 18, 60, 0.12)',
    icon: RotateCcw,
  },
};

export const PRIORITY_MAP: Record<IssuePriority, { label: string; color: string; bgTint: string; icon: React.ComponentType<{ className?: string }> }> = {
  LOW: {
    label: 'Low',
    color: '#64748B',
    bgTint: 'rgba(100, 116, 139, 0.12)',
    icon: ArrowDown,
  },
  MEDIUM: {
    label: 'Medium',
    color: '#2F6FDE',
    bgTint: 'rgba(47, 111, 222, 0.12)',
    icon: Minus,
  },
  HIGH: {
    label: 'High',
    color: '#D97706',
    bgTint: 'rgba(217, 119, 6, 0.12)',
    icon: ArrowUp,
  },
  CRITICAL: {
    label: 'Critical',
    color: '#B91C1C',
    bgTint: 'rgba(185, 28, 28, 0.12)',
    icon: AlertTriangle,
  },
};

export interface StatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const config = STATUS_MAP[status] || STATUS_MAP.SUBMITTED;
  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-badge ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      style={{
        backgroundColor: config.bgTint,
        color: config.color,
      }}
    >
      <Icon className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};

export interface PriorityBadgeProps {
  priority: IssuePriority;
  size?: 'sm' | 'md';
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md', className = '' }) => {
  const config = PRIORITY_MAP[priority] || PRIORITY_MAP.LOW;
  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-badge ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      style={{
        backgroundColor: config.bgTint,
        color: config.color,
      }}
    >
      <Icon className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};

export interface ConfidenceBadgeProps {
  score: number; // 0 to 100
  size?: 'sm' | 'md';
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, size = 'md', className = '' }) => {
  let band: ConfidenceBand = 'MANUAL_REVIEW';
  let label = `Evidence: ${score}% (Manual Review)`;
  let color = '#D97706';
  let bgTint = 'rgba(217, 119, 6, 0.12)';
  let Icon = AlertCircle;

  if (score >= 90) {
    band = 'HIGH';
    label = `Evidence: ${score}% (High Confidence)`;
    color = '#0E7378';
    bgTint = 'rgba(14, 115, 120, 0.12)';
    Icon = ShieldCheck;
  } else if (score >= 70) {
    band = 'MEDIUM';
    label = `Evidence: ${score}% (Medium Confidence)`;
    color = '#2F6FDE';
    bgTint = 'rgba(47, 111, 222, 0.12)';
    Icon = Sparkles;
  }

  const isSm = size === 'sm';

  return (
    <span
      title="Operational indicator based on location, timestamp, and perceptual hash analysis; not absolute proof."
      className={`inline-flex items-center gap-1.5 font-medium rounded-badge ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${className}`}
      style={{
        backgroundColor: bgTint,
        color: color,
      }}
      data-confidence-band={band}
    >
      <Icon className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};

export interface BadgeProps {
  variant?: IssueStatus | IssuePriority | 'default' | string;
  size?: 'sm' | 'md';
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', size = 'md', className = '', children }) => {
  if (variant && variant in STATUS_MAP) {
    return <StatusBadge status={variant as IssueStatus} size={size} className={className} />;
  }
  if (variant && variant in PRIORITY_MAP) {
    return <PriorityBadge priority={variant as IssuePriority} size={size} className={className} />;
  }

  const isSm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-badge bg-surface text-ink-700 border border-line ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${className}`}
    >
      {children || variant}
    </span>
  );
};

