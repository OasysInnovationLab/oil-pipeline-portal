import { useState } from 'react';
import { RefreshCw, Filter, CheckCircle, XCircle, Clock, Radio } from 'lucide-react';
import { useRecentRuns, usePipelineStats } from '@/hooks/usePipelines';
import { usePipelineTransitions } from '@/hooks/useTransitions';
import { hasGitHubToken } from '@/api/github';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PipelineCard } from '@/components/pipeline/PipelineCard';
import { TransitionNotifications } from '@/components/pipeline/TransitionNotification';
import { formatDuration } from '@/lib/utils';
import type { PipelineStatus } from '@/types/pipeline';

export function Dashboard() {
  const [statusFilter, setStatusFilter] = useState<PipelineStatus | 'all'>('all');
  const { data: runs, isLoading, error, refetch, isFetching } = useRecentRuns(100);

  const stats = usePipelineStats(runs);
  
  // Track pipeline transitions for notifications
  const { recentTransitions, clearTransition } = usePipelineTransitions(runs);

  // Filter runs by status
  const filteredRuns = runs?.filter((run) => {
    if (statusFilter === 'all') return true;
    return run.status === statusFilter;
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load pipelines</h2>
        <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Pipeline Dashboard
          </h1>
          <p className="text-white/50 mt-1">
            Monitor CI/CD pipeline status across all repositories
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Radio className="h-3 w-3 text-green-500 animate-pulse" />
            <span>Live updates {hasGitHubToken() ? 'enabled' : '(unauthenticated)'}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="dark:border-white/20 dark:hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Runs"
          value={stats.totalRuns}
          icon={<Clock className="h-4 w-4" />}
          description="Last 100 runs"
        />
        <StatsCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          description="Passing pipelines"
          trend={stats.successRate >= 80 ? 'up' : 'down'}
        />
        <StatsCard
          title="Avg Duration"
          value={formatDuration(stats.averageDuration)}
          icon={<Clock className="h-4 w-4" />}
          description="Average build time"
        />
        <StatsCard
          title="Failed"
          value={runs?.filter((r) => r.status === 'failure').length || 0}
          icon={<XCircle className="h-4 w-4 text-red-500" />}
          description="Needs attention"
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter:</span>
        <div className="flex gap-1">
          {(['all', 'success', 'failure', 'in_progress'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Button>
          ))}
        </div>
        {statusFilter !== 'all' && (
          <span className="text-xs text-muted-foreground ml-2">
            {filteredRuns?.length} results
          </span>
        )}
      </div>

      {/* Pipeline list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-muted-foreground">Loading pipelines...</span>
        </div>
      ) : filteredRuns && filteredRuns.length > 0 ? (
        <div className="grid gap-3">
          {filteredRuns.map((run) => (
            <PipelineCard key={`${run.repository}-${run.run_id}`} run={run} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pipeline runs found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {statusFilter !== 'all'
                ? `No runs with status "${statusFilter}" found. Try a different filter.`
                : 'Pipeline runs will appear here once workflows start reporting to the portal.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pipeline transition notifications */}
      <TransitionNotifications
        transitions={recentTransitions}
        onDismiss={clearTransition}
      />
    </div>
  );
}

// Stats card component
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend?: 'up' | 'down';
}

function StatsCard({ title, value, icon, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
