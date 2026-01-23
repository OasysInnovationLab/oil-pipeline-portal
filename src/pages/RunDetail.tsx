import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  GitCommit,
  GitPullRequest,
  Clock,
  User,
  ExternalLink,
  GitCompare,
  RefreshCw,
} from 'lucide-react';
import { usePipelineRun } from '@/hooks/usePipelines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatusBadge } from '@/components/pipeline/StatusBadge';
import { JobTimeline, JobSteps } from '@/components/pipeline/JobTimeline';
import { CorrectiveActions } from '@/components/pipeline/CorrectiveActions';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

export function RunDetail() {
  const { owner, repo, runId } = useParams<{
    owner: string;
    repo: string;
    runId: string;
  }>();
  const repository = `${owner}/${repo}`;
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const { data: run, isLoading, error, refetch, isFetching } = usePipelineRun(
    repository,
    runId!
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-muted-foreground">Loading run details...</span>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="space-y-4">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-lg font-semibold mb-2">Run not found</h2>
            <p className="text-muted-foreground mb-4">
              {(error as Error)?.message || 'Unable to load pipeline run details'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedJobData = selectedJob ? run.jobs[selectedJob] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">{repo}</h1>
              <StatusBadge status={run.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Run #{run.run_id} • {run.workflow}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <a href={run.links.workflow_run} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </Button>
          </a>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Commit */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GitCommit className="h-4 w-4" />
              Commit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={run.links.diff}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {run.commit.sha.substring(0, 7)}
              </code>
            </a>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {run.commit.message}
            </p>
          </CardContent>
        </Card>

        {/* Branch / PR */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {run.pull_request ? (
                <GitPullRequest className="h-4 w-4" />
              ) : (
                <GitCompare className="h-4 w-4" />
              )}
              {run.pull_request ? 'Pull Request' : 'Branch'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {run.pull_request ? (
              <a
                href={run.pull_request.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline font-medium"
              >
                #{run.pull_request.number}
              </a>
            ) : (
              <span className="font-medium">{run.branch}</span>
            )}
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {run.pull_request?.title || `Branch: ${run.branch}`}
            </p>
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-medium">{formatDuration(run.duration_seconds)}</span>
            <p className="text-sm text-muted-foreground mt-1">
              {formatRelativeTime(run.started_at)}
            </p>
          </CardContent>
        </Card>

        {/* Actor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Triggered By
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-medium">{run.actor}</span>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {run.trigger.replace('_', ' ')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content - Jobs and Corrective Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Jobs timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <JobTimeline
              jobs={run.jobs}
              selectedJob={selectedJob || undefined}
              onJobClick={setSelectedJob}
            />

            {/* Selected job steps */}
            {selectedJobData && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-sm mb-3">
                  Steps for: {selectedJob}
                </h4>
                <JobSteps job={selectedJobData} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Corrective Actions */}
        <div>
          <CorrectiveActions actions={run.corrective_actions} status={run.status} />

          {/* Quick links */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href={run.links.workflow_run}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                View Workflow Run on GitHub
              </a>
              <a
                href={run.links.diff}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline text-primary"
              >
                <GitCompare className="h-4 w-4" />
                View Code Changes
              </a>
              <a
                href={run.links.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                View Repository
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
