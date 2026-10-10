import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SlaTimerProps {
  deadline: string | null | undefined;
  status?: string;
  compact?: boolean;
}

export const SlaTimer: React.FC<SlaTimerProps> = ({ deadline, status, compact = false }) => {
  const isTerminal = ['DONE', 'VERIFIED', 'CLOSED', 'REJECTED'].includes(status || '');

  const calculateRemaining = () => {
    if (!deadline || isTerminal) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.floor(diff / 1000);
  };

  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(calculateRemaining);

  useEffect(() => {
    if (!deadline || isTerminal) return;

    setRemainingSeconds(calculateRemaining());
    const interval = setInterval(() => {
      setRemainingSeconds(calculateRemaining());
    }, 30000); // update every 30s

    return () => clearInterval(interval);
  }, [deadline, status]);

  if (isTerminal) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-badge bg-status-verified/10 text-status-verified font-medium">
        <CheckCircle2 className="w-3 h-3" />
        Resolved
      </span>
    );
  }

  if (!deadline || remainingSeconds === null) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-badge bg-surface text-ink-500 border border-line">
        <Clock className="w-3 h-3 text-ink-300" />
        No SLA
      </span>
    );
  }

  // Format time text
  const isBreached = remainingSeconds <= 0;
  const absSeconds = Math.abs(remainingSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);

  let timeString = '';
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    timeString = `${days}d ${remHours}h`;
  } else {
    timeString = `${hours}h ${minutes}m`;
  }

  if (isBreached) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-badge bg-semantic-danger/10 text-semantic-danger font-semibold border border-semantic-danger/20">
        <AlertCircle className="w-3 h-3" />
        {compact ? `-${timeString}` : `Breached (-${timeString})`}
      </span>
    );
  }

  // Approaching if less than 6 hours remaining
  const isApproaching = remainingSeconds < 6 * 3600;

  if (isApproaching) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-badge bg-accent-500/15 text-ink-950 font-semibold border border-accent-500/30">
        <AlertTriangle className="w-3 h-3 text-accent-500" />
        {compact ? timeString : `${timeString} left`}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded-badge bg-primary-100 text-primary-700 font-medium border border-primary-600/20">
      <Clock className="w-3 h-3 text-primary-600" />
      {compact ? timeString : `${timeString} left`}
    </span>
  );
};
