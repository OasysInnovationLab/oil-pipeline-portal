import { StatusIcon } from './StatusBadge';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { JobInfo } from '@/types/pipeline';
import { ChevronRight, ExternalLink } from 'lucide-react';

interface JobTimelineProps {
  jobs: Record<string, JobInfo>;
  onJobClick?: (jobName: string) => void;
  selectedJob?: string;
}

export function JobTimeline({ jobs, onJobClick, selectedJob }: JobTimelineProps) {
  const jobEntries = Object.entries(jobs);

  // Sort jobs by start time
  const sortedJobs = jobEntries.sort((a, b) => {
    if (!a[1].started_at) return 1;
    if (!b[1].started_at) return -1;
    return new Date(a[1].started_at).getTime() - new Date(b[1].started_at).getTime();
  });

  return (
    <div className="space-y-1">
      {sortedJobs.map(([name, job], index) => (
        <div key={name}>
          <JobTimelineItem
            name={name}
            job={job}
            isFirst={index === 0}
            isLast={index === sortedJobs.length - 1}
            isSelected={selectedJob === name}
            onClick={() => onJobClick?.(name)}
          />
          {selectedJob === name && (
            <div className="ml-8 mt-1 mb-2">
              <JobSteps job={job} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface JobTimelineItemProps {
  name: string;
  job: JobInfo;
  isFirst: boolean;
  isLast: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function JobTimelineItem({
  name,
  job,
  isFirst,
  isLast,
  isSelected,
  onClick,
}: JobTimelineItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
        'hover:bg-muted/50',
        isSelected && 'bg-muted border border-primary/20'
      )}
    >
      {/* Status indicator with connector line */}
      <div className="relative flex flex-col items-center">
        {!isFirst && (
          <div className="absolute bottom-full h-2 w-0.5 bg-border" />
        )}
        <StatusIcon status={job.status} size="md" />
        {!isLast && (
          <div className="absolute top-full h-2 w-0.5 bg-border" />
        )}
      </div>

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{name}</span>
          {job.failed_steps.length > 0 && (
            <span className="text-xs text-red-500">
              ({job.failed_steps.length} failed)
            </span>
          )}
        </div>
        {job.duration_seconds && (
          <span className="text-xs text-muted-foreground">
            {formatDuration(job.duration_seconds)}
          </span>
        )}
      </div>

      {/* External link */}
      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}

      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

// Step details for a selected job
interface JobStepsProps {
  job: JobInfo;
}

export function JobSteps({ job }: JobStepsProps) {
  return (
    <div className="space-y-2 pl-4 border-l-2 border-muted">
      {job.steps.map((step, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-2 p-2 rounded text-sm',
            step.status === 'failure' && 'bg-red-500/10'
          )}
        >
          <StatusIcon status={step.status} size="sm" />
          <span className="flex-1 truncate">{step.name}</span>
          {step.started_at && step.completed_at && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(
                Math.round(
                  (new Date(step.completed_at).getTime() -
                    new Date(step.started_at).getTime()) /
                    1000
                )
              )}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
