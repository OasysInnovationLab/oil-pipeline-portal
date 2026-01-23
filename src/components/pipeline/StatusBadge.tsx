import {
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineStatus, JobStatus } from '@/types/pipeline';

interface StatusBadgeProps {
  status: PipelineStatus | JobStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle; label: string; className: string }
> = {
  success: {
    icon: CheckCircle,
    label: 'Success',
    className: 'text-green-500 bg-green-500/10',
  },
  failure: {
    icon: XCircle,
    label: 'Failed',
    className: 'text-red-500 bg-red-500/10',
  },
  cancelled: {
    icon: Ban,
    label: 'Cancelled',
    className: 'text-gray-500 bg-gray-500/10',
  },
  skipped: {
    icon: AlertCircle,
    label: 'Skipped',
    className: 'text-gray-400 bg-gray-400/10',
  },
  in_progress: {
    icon: Loader2,
    label: 'Running',
    className: 'text-blue-500 bg-blue-500/10',
  },
  queued: {
    icon: Clock,
    label: 'Queued',
    className: 'text-yellow-500 bg-yellow-500/10',
  },
};

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StatusBadge({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.cancelled;
  const Icon = config.icon;
  const isAnimated = status === 'in_progress';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon
        className={cn(sizeClasses[size], isAnimated && 'animate-spin')}
      />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

// Simple icon-only version
export function StatusIcon({
  status,
  size = 'md',
  className,
}: Omit<StatusBadgeProps, 'showLabel'>) {
  const config = statusConfig[status] || statusConfig.cancelled;
  const Icon = config.icon;
  const isAnimated = status === 'in_progress';

  return (
    <Icon
      className={cn(
        sizeClasses[size],
        config.className.split(' ')[0], // Just the text color
        isAnimated && 'animate-spin',
        className
      )}
    />
  );
}
