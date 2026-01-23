// =============================================================================
// Pipeline Types
// =============================================================================

export interface PipelineRun {
  run_id: number;
  repository: string;
  workflow: string;
  workflow_file: string;
  trigger: 'push' | 'pull_request' | 'schedule' | 'workflow_dispatch' | 'release';
  branch: string;
  commit: CommitInfo;
  pull_request: PullRequestInfo | null;
  actor: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  status: PipelineStatus;
  jobs: Record<string, JobInfo>;
  corrective_actions: CorrectiveAction[];
  links: PipelineLinks;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
}

export interface PullRequestInfo {
  number: number;
  title: string;
  url: string;
  base_branch?: string;
  head_branch?: string;
}

export interface JobInfo {
  status: JobStatus;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  steps: StepInfo[];
  failed_steps: string[];
  url: string;
}

export interface StepInfo {
  name: string;
  status: StepStatus;
  started_at: string | null;
  completed_at: string | null;
  number: number;
}

export interface CorrectiveAction {
  severity: 'error' | 'warning' | 'info';
  job: string;
  title: string;
  description: string;
  suggestion: string;
  doc_link?: string | null;
}

export interface PipelineLinks {
  workflow_run: string;
  diff: string;
  repository: string;
  artifacts?: string;
}

export type PipelineStatus = 'success' | 'failure' | 'cancelled' | 'in_progress' | 'queued';
export type JobStatus = 'success' | 'failure' | 'cancelled' | 'skipped' | 'in_progress' | 'queued';
export type StepStatus = 'success' | 'failure' | 'cancelled' | 'skipped' | 'in_progress';

// =============================================================================
// Index Types
// =============================================================================

export interface PipelineIndexEntry {
  run_id: number;
  status: PipelineStatus;
  branch: string;
  commit_sha: string;
  commit_message: string;
  actor: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  pull_request_number: number | null;
}

export interface PipelineManifest {
  run_ids: string[];
  updated_at: string;
  total_runs: number;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface RepositoryInfo {
  owner: string;
  name: string;
  full_name: string;
}

export interface PipelineListResponse {
  runs: PipelineIndexEntry[];
  total: number;
  repository: string;
}
