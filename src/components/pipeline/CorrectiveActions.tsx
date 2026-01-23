import { AlertTriangle, AlertCircle, Info, ExternalLink, Wrench, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { CorrectiveAction, PipelineStatus } from '@/types/pipeline';

interface CorrectiveActionsProps {
  actions: CorrectiveAction[];
  status?: PipelineStatus;
}

export function CorrectiveActions({ actions, status }: CorrectiveActionsProps) {
  // Show loading state for in-progress or queued runs
  if (status === 'in_progress' || status === 'queued') {
    return (
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="font-medium">Pipeline in progress</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Corrective actions will be available once the pipeline completes.
            This page auto-refreshes every 5 seconds.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show cancelled state
  if (status === 'cancelled') {
    return (
      <Card className="border-gray-500/20 bg-gray-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <XCircle className="h-5 w-5" />
            <span className="font-medium">Pipeline was cancelled</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            No corrective actions needed for cancelled pipelines.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (actions.length === 0) {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-600">
            <span className="text-lg">✅</span>
            <span className="font-medium">No corrective actions needed</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            All pipeline jobs completed successfully.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5" />
          Corrective Actions
          <span className="text-sm font-normal text-muted-foreground">
            ({actions.length} {actions.length === 1 ? 'item' : 'items'})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <CorrectiveActionCard key={index} action={action} />
        ))}
      </CardContent>
    </Card>
  );
}

interface CorrectiveActionCardProps {
  action: CorrectiveAction;
}

const severityConfig = {
  error: {
    icon: AlertTriangle,
    className: 'border-red-500/30 bg-red-500/5',
    iconClassName: 'text-red-500',
    label: 'Error',
  },
  warning: {
    icon: AlertCircle,
    className: 'border-yellow-500/30 bg-yellow-500/5',
    iconClassName: 'text-yellow-500',
    label: 'Warning',
  },
  info: {
    icon: Info,
    className: 'border-blue-500/30 bg-blue-500/5',
    iconClassName: 'text-blue-500',
    label: 'Info',
  },
};

function CorrectiveActionCard({ action }: CorrectiveActionCardProps) {
  const config = severityConfig[action.severity];
  const Icon = config.icon;

  return (
    <div className={cn('rounded-lg border p-4', config.className)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.iconClassName)} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm">{action.title}</h4>
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              {action.job}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {action.description}
          </p>
          
          <div className="bg-muted/50 rounded p-3 text-sm">
            <span className="font-medium">Suggestion: </span>
            {action.suggestion}
          </div>

          {action.doc_link && (
            <a
              href={action.doc_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              <ExternalLink className="h-3 w-3" />
              View Documentation
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact inline version for dashboard
export function CorrectiveActionsSummary({ actions }: CorrectiveActionsProps) {
  const errorCount = actions.filter((a) => a.severity === 'error').length;
  const warningCount = actions.filter((a) => a.severity === 'warning').length;

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {errorCount > 0 && (
        <span className="flex items-center gap-1 text-red-500">
          <AlertTriangle className="h-3 w-3" />
          {errorCount} error{errorCount !== 1 && 's'}
        </span>
      )}
      {warningCount > 0 && (
        <span className="flex items-center gap-1 text-yellow-500">
          <AlertCircle className="h-3 w-3" />
          {warningCount} warning{warningCount !== 1 && 's'}
        </span>
      )}
    </div>
  );
}
