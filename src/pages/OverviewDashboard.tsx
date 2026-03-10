import { useState } from 'react';
import { RefreshCw, Calendar, TrendingUp, BarChart3, Radio } from 'lucide-react';
import { useRecentRuns } from '@/hooks/usePipelines';
import { hasGitHubToken } from '@/api/github';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OverviewSummary } from '@/components/pipeline/OverviewSummary';

type Period = 'day' | 'week' | 'month';

export function OverviewDashboard() {
  const [period, setPeriod] = useState<Period>('week');
  const { data: runs, isLoading, error, refetch, isFetching } = useRecentRuns(200);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BarChart3 className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">Failed to load data</h2>
        <p className="text-muted-foreground mb-4">{(error as Error).message}</p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Pipeline Portal
          </h1>
          <p className="text-white/50 mt-1">
            Deployment activity and system health at a glance
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

      {/* Period Selector */}
      <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-lg w-fit">
        <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
        {(['day', 'week', 'month'] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod(p)}
            className="capitalize"
          >
            {p === 'day' ? 'Today' : `This ${p}`}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-muted-foreground">Loading summary...</span>
        </div>
      ) : runs && runs.length > 0 ? (
        <OverviewSummary runs={runs} period={period} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <TrendingUp className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground max-w-md">
            Pipeline runs will appear here once workflows start reporting to the portal.
            Make sure your CI/CD pipelines are configured to use the pipeline-report workflow.
          </p>
        </div>
      )}
    </div>
  );
}
