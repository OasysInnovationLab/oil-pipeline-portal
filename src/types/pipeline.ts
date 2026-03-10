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
  deployment_summary?: DeploymentSummary;
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
// Deployment Summary Types
// =============================================================================

export interface DeploymentSummary {
  environment: 'dev' | 'staging' | 'prod';
  services_deployed: string[];
  version: string;
  previous_version?: string;
  changes: DeploymentChange[];
  metrics?: DeploymentMetrics;
}

export interface DeploymentChange {
  type: 'feature' | 'bugfix' | 'security' | 'performance' | 'infrastructure' | 'documentation';
  title: string;
  description?: string;
  ticket_id?: string;
  author: string;
}

export interface DeploymentMetrics {
  tests_passed: number;
  tests_failed: number;
  coverage_percent?: number;
  security_issues_found: number;
  security_issues_fixed: number;
  performance_score?: number;
}

// =============================================================================
// Executive Dashboard Types
// =============================================================================

export interface ExecutiveSummary {
  period: 'day' | 'week' | 'month';
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  success_rate: number;
  average_duration_seconds: number;
  services_updated: string[];
  active_contributors: string[];
  highlights: DeploymentHighlight[];
  by_environment: Record<string, EnvironmentStats>;
}

export interface EnvironmentStats {
  deployments: number;
  success_rate: number;
  last_deployment?: string;
}

export interface DeploymentHighlight {
  type: 'milestone' | 'alert' | 'trend';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  related_run_id?: number;
}

// =============================================================================
// Real-time Status Types
// =============================================================================

export interface PipelineTransition {
  run_id: number;
  repository: string;
  from_status: PipelineStatus;
  to_status: PipelineStatus;
  timestamp: string;
  duration_seconds?: number;
}

export interface ActivePipelineState {
  repository: string;
  run_id: number;
  status: PipelineStatus;
  started_at: string;
  current_job?: string;
  progress_percent: number;
  estimated_completion?: string;
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
