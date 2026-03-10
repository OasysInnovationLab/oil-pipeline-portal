import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle, XCircle, Ban, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/utils';
import type { PipelineTransition } from '@/types/pipeline';

interface TransitionNotificationProps {
  transition: PipelineTransition;
  onDismiss: () => void;
}

export function TransitionNotification({
  transition,
  onDismiss,
}: TransitionNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const repo = transition.repository.split('/')[1];
  const [owner, repoName] = transition.repository.split('/');

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto dismiss after 10 seconds
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  const statusConfig = {
    success: {
      icon: CheckCircle,
      title: 'Pipeline Completed',
      bg: 'bg-green-500/20 border-green-500/30',
      iconColor: 'text-green-500',
    },
    failure: {
      icon: XCircle,
      title: 'Pipeline Failed',
      bg: 'bg-red-500/20 border-red-500/30',
      iconColor: 'text-red-500',
    },
    cancelled: {
      icon: Ban,
      title: 'Pipeline Cancelled',
      bg: 'bg-gray-500/20 border-gray-500/30',
      iconColor: 'text-gray-500',
    },
    in_progress: {
      icon: CheckCircle,
      title: 'Pipeline Started',
      bg: 'bg-blue-500/20 border-blue-500/30',
      iconColor: 'text-blue-500',
    },
    queued: {
      icon: CheckCircle,
      title: 'Pipeline Queued',
      bg: 'bg-yellow-500/20 border-yellow-500/30',
      iconColor: 'text-yellow-500',
    },
  };

  const config = statusConfig[transition.to_status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 w-80 rounded-lg border backdrop-blur-md shadow-lg transition-all duration-300',
        config.bg,
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      {/* Progress bar for auto-dismiss */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 rounded-t-lg overflow-hidden">
        <div
          className="h-full bg-white/30 transition-all duration-[10000ms] ease-linear"
          style={{ width: isVisible ? '0%' : '100%' }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconColor)} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{config.title}</h4>
              <button
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-0.5">
              {repo}
            </p>
            
            {transition.duration_seconds && (
              <p className="text-xs text-muted-foreground mt-1">
                Completed in {formatDuration(transition.duration_seconds)}
              </p>
            )}
            
            <Link
              to={`/runs/${owner}/${repoName}/${transition.run_id}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              onClick={handleDismiss}
            >
              View details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TransitionNotificationsProps {
  transitions: PipelineTransition[];
  onDismiss: (runId: number) => void;
}

export function TransitionNotifications({
  transitions,
  onDismiss,
}: TransitionNotificationsProps) {
  // Only show the most recent transition
  const latestTransition = transitions[0];

  if (!latestTransition) return null;

  return (
    <TransitionNotification
      key={`${latestTransition.repository}-${latestTransition.run_id}`}
      transition={latestTransition}
      onDismiss={() => onDismiss(latestTransition.run_id)}
    />
  );
}
