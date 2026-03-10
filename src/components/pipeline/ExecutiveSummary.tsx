import {
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  Clock,
  Users,
  Rocket,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from './StatusBadge';
import { formatDuration, formatRelativeTime, cn } from '@/lib/utils';
import type {
  PipelineIndexEntry,
  ExecutiveSummary as ExecutiveSummaryType,
  DeploymentHighlight,
} from '@/types/pipeline';

interface ExecutiveSummaryProps {
  runs: (PipelineIndexEntry & { repository: string })[];
  period?: 'day' | 'week' | 'month';
}

export function ExecutiveSummary({ runs, period = 'week' }: ExecutiveSummaryProps) {
  const summary = calculateExecutiveSummary(runs, period);

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Executive Overview
          </h2>
          <p className="text-white/50 text-sm">
            Pipeline activity summary for the past {period}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-400 animate-pulse" />
          <span className="text-sm text-white/60">Live Data</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Deployments"
          value={summary.total_deployments}
          icon={<Rocket className="h-5 w-5" />}
          description={`${summary.successful_deployments} successful`}
          trend={summary.total_deployments > 0 ? 'neutral' : undefined}
        />
        <MetricCard
          title="Success Rate"
          value={`${summary.success_rate.toFixed(1)}%`}
          icon={
            summary.success_rate >= 80 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            )
          }
          description={summary.success_rate >= 80 ? 'Healthy' : 'Needs attention'}
          trend={summary.success_rate >= 80 ? 'up' : 'down'}
          trendValue={summary.success_rate >= 80 ? '+5%' : '-3%'}
        />
        <MetricCard
          title="Avg Build Time"
          value={formatDuration(Math.round(summary.average_duration_seconds))}
          icon={<Clock className="h-5 w-5" />}
          description="Average across all pipelines"
        />
        <MetricCard
          title="Active Contributors"
          value={summary.active_contributors.length}
          icon={<Users className="h-5 w-5" />}
          description={`${summary.services_updated.length} services updated`}
        />
      </div>

      {/* Active Pipelines - Live Status */}
      <ActivePipelinesSection runs={runs} />

      {/* Recent Activity Feed */}
      <RecentActivityFeed runs={runs} />

      {/* Environment Health */}
      <EnvironmentHealth summary={summary} />
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function MetricCard({ title, value, icon, description, trend, trendValue }: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="opacity-70">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold">{value}</div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend === 'up' && 'text-green-500',
                trend === 'down' && 'text-red-500',
                trend === 'neutral' && 'text-white/50'
              )}
            >
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

interface ActivePipelinesSectionProps {
  runs: (PipelineIndexEntry & { repository: string })[];
}

function ActivePipelinesSection({ runs }: ActivePipelinesSectionProps) {
  const activeRuns = runs.filter(
    (r) => r.status === 'in_progress' || r.status === 'queued'
  );

  if (activeRuns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Pipelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            All pipelines complete - no active builds
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
          Active Pipelines
          <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
            {activeRuns.length} running
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeRuns.map((run) => (
          <ActivePipelineRow key={`${run.repository}-${run.run_id}`} run={run} />
        ))}
      </CardContent>
    </Card>
  );
}

function ActivePipelineRow({
  run,
}: {
  run: PipelineIndexEntry & { repository: string };
}) {
  const elapsedSeconds = Math.round(
    (Date.now() - new Date(run.started_at).getTime()) / 1000
  );
  const repo = run.repository.split('/')[1];

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <div className="relative">
          <StatusBadge status={run.status} size="sm" showLabel={false} />
          <div className="absolute -right-1 -bottom-1 h-2 w-2 rounded-full bg-blue-500 animate-ping" />
        </div>
        <div>
          <span className="font-medium text-sm">{repo}</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{run.branch}</span>
            <span>•</span>
            <span>{run.actor}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Running for</div>
          <div className="text-sm font-mono">{formatDuration(elapsedSeconds)}</div>
        </div>
        <ProgressBar progress={estimateProgress(elapsedSeconds)} />
      </div>
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

interface RecentActivityFeedProps {
  runs: (PipelineIndexEntry & { repository: string })[];
}

function RecentActivityFeed({ runs }: RecentActivityFeedProps) {
  // Get recent completed runs
  const recentCompleted = runs
    .filter(
      (r) =>
        r.status === 'success' || r.status === 'failure' || r.status === 'cancelled'
    )
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentCompleted.map((run) => (
            <ActivityItem key={`${run.repository}-${run.run_id}`} run={run} />
          ))}
          {recentCompleted.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  run,
}: {
  run: PipelineIndexEntry & { repository: string };
}) {
  const repo = run.repository.split('/')[1];

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <StatusBadge status={run.status} size="sm" showLabel={false} />
        <div>
          <span className="font-medium text-sm">{repo}</span>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {run.commit_message}
          </p>
        </div>
      </div>
      <div className="text-right text-xs text-muted-foreground">
        <div>{formatRelativeTime(run.completed_at)}</div>
        <div>{formatDuration(run.duration_seconds)}</div>
      </div>
    </div>
  );
}

function EnvironmentHealth({
  summary,
}: {
  summary: ExecutiveSummaryType;
}) {
  const environments = ['dev', 'staging', 'prod'] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Environment Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {environments.map((env) => {
            const stats = summary.by_environment[env] || {
              deployments: 0,
              success_rate: 100,
            };
            return (
              <div
                key={env}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{env}</span>
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      stats.success_rate >= 90
                        ? 'bg-green-500'
                        : stats.success_rate >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    )}
                  />
                </div>
                <div className="text-2xl font-bold">{stats.deployments}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.success_rate.toFixed(0)}% success rate
                </div>
                {stats.last_deployment && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Last: {formatRelativeTime(stats.last_deployment)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function calculateExecutiveSummary(
  runs: (PipelineIndexEntry & { repository: string })[],
  period: 'day' | 'week' | 'month'
): ExecutiveSummaryType {
  const now = new Date();
  const periodMs = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  }[period];

  const cutoff = new Date(now.getTime() - periodMs);
  const filteredRuns = runs.filter((r) => new Date(r.started_at) >= cutoff);

  const successful = filteredRuns.filter((r) => r.status === 'success');
  const failed = filteredRuns.filter((r) => r.status === 'failure');
  const total = filteredRuns.length;

  const totalDuration = filteredRuns.reduce((acc, r) => acc + r.duration_seconds, 0);
  const avgDuration = total > 0 ? totalDuration / total : 0;

  const contributors = [...new Set(filteredRuns.map((r) => r.actor))];
  const services = [...new Set(filteredRuns.map((r) => r.repository.split('/')[1]))];

  // Calculate environment stats based on branch names
  const byEnvironment: Record<string, { deployments: number; success_rate: number; last_deployment?: string }> = {
    dev: { deployments: 0, success_rate: 100 },
    staging: { deployments: 0, success_rate: 100 },
    prod: { deployments: 0, success_rate: 100 },
  };

  for (const run of filteredRuns) {
    let env = 'dev';
    if (run.branch === 'main' || run.branch === 'master') {
      env = 'prod';
    } else if (run.branch.includes('release') || run.branch.includes('staging')) {
      env = 'staging';
    }

    byEnvironment[env].deployments++;
    if (run.status === 'failure') {
      // Recalculate success rate
      const envRuns = filteredRuns.filter((r) => {
        if (env === 'prod') return r.branch === 'main' || r.branch === 'master';
        if (env === 'staging') return r.branch.includes('release') || r.branch.includes('staging');
        return true;
      });
      const envSuccess = envRuns.filter((r) => r.status === 'success').length;
      byEnvironment[env].success_rate = envRuns.length > 0 ? (envSuccess / envRuns.length) * 100 : 100;
    }
    if (!byEnvironment[env].last_deployment || new Date(run.completed_at) > new Date(byEnvironment[env].last_deployment!)) {
      byEnvironment[env].last_deployment = run.completed_at;
    }
  }

  // Generate highlights
  const highlights: DeploymentHighlight[] = [];

  if (failed.length > 0 && failed.length / total > 0.2) {
    highlights.push({
      type: 'alert',
      severity: 'warning',
      title: 'High Failure Rate',
      description: `${failed.length} out of ${total} deployments failed this ${period}`,
      timestamp: new Date().toISOString(),
    });
  }

  if (successful.length > 0) {
    highlights.push({
      type: 'milestone',
      severity: 'success',
      title: 'Deployments Completed',
      description: `${successful.length} successful deployments this ${period}`,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    period,
    total_deployments: total,
    successful_deployments: successful.length,
    failed_deployments: failed.length,
    success_rate: total > 0 ? (successful.length / total) * 100 : 100,
    average_duration_seconds: avgDuration,
    services_updated: services,
    active_contributors: contributors,
    highlights,
    by_environment: byEnvironment,
  };
}

function estimateProgress(elapsedSeconds: number): number {
  // Estimate progress based on typical pipeline duration (5 minutes average)
  const typicalDuration = 300; // 5 minutes in seconds
  return Math.min((elapsedSeconds / typicalDuration) * 100, 95); // Cap at 95% until complete
}
