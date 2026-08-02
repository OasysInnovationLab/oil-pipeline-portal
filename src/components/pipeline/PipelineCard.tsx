import { Link } from 'react-router-dom';
import { GitCommit, GitPullRequest, Clock, User, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from './StatusBadge';
import { TierBadge } from './TierBadge';
import { formatDuration, formatRelativeTime, truncateCommitMessage } from '@/lib/utils';
import type { PipelineIndexEntry } from '@/types/pipeline';

interface PipelineCardProps {
  run: PipelineIndexEntry & { repository: string };
}

export function PipelineCard({ run }: PipelineCardProps) {
  const [owner, repo] = run.repository.split('/');
  const detailUrl = `/runs/${owner}/${repo}/${run.run_id}`;

  return (
    <Link to={detailUrl}>
      <Card className="group hover:scale-[1.01] transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Main info */}
            <div className="flex-1 min-w-0">
              {/* Repository and status */}
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{repo}</span>
                <StatusBadge status={run.status} size="sm" />
                <TierBadge tier={run.atlas_tier} />
              </div>

              {/* Commit info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <GitCommit className="h-4 w-4 flex-shrink-0" />
                <code className="text-xs bg-white/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">
                  {run.commit_sha.substring(0, 7)}
                </code>
                <span className="truncate opacity-80">
                  {truncateCommitMessage(run.commit_message, 40)}
                </span>
              </div>

              {/* Branch and PR */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="bg-white/10 dark:bg-white/10 px-2 py-0.5 rounded">{run.branch}</span>
                {run.pull_request_number && (
                  <span className="flex items-center gap-1">
                    <GitPullRequest className="h-3 w-3" />
                    #{run.pull_request_number}
                  </span>
                )}
              </div>
            </div>

            {/* Right side - Meta info */}
            <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(run.duration_seconds)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {run.actor}
              </span>
              <span className="opacity-60">{formatRelativeTime(run.started_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Compact version for lists
export function PipelineCardCompact({ run }: PipelineCardProps) {
  const [owner, repo] = run.repository.split('/');
  const detailUrl = `/runs/${owner}/${repo}/${run.run_id}`;

  return (
    <Link
      to={detailUrl}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <StatusBadge status={run.status} size="sm" showLabel={false} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{repo}</span>
          <code className="text-xs text-muted-foreground">
            {run.commit_sha.substring(0, 7)}
          </code>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {run.commit_message}
        </p>
      </div>

      <div className="text-xs text-muted-foreground text-right">
        <div>{formatRelativeTime(run.started_at)}</div>
        <div>{formatDuration(run.duration_seconds)}</div>
      </div>

      <ExternalLink className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
