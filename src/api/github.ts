import type {
  PipelineIndexEntry,
  PipelineRun,
  PipelineStatus,
  JobInfo,
  StepInfo,
} from '@/types/pipeline';

// =============================================================================
// GitHub API Configuration
// =============================================================================

// GitHub token should be set via environment variable
// For public repos, this is optional but increases rate limits
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';
const GITHUB_API_BASE = 'https://api.github.com';

// =============================================================================
// Types for GitHub API responses
// =============================================================================

interface GitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'pending';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral' | 'timed_out' | 'action_required' | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  run_started_at: string;
  actor: {
    login: string;
    avatar_url: string;
  };
  triggering_actor: {
    login: string;
  };
  event: string;
  path: string;
  pull_requests: Array<{
    number: number;
    url: string;
    head: { ref: string };
    base: { ref: string };
  }>;
  repository: {
    full_name: string;
  };
  head_commit: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    timestamp: string;
  };
}

interface GitHubJob {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral' | null;
  started_at: string | null;
  completed_at: string | null;
  html_url: string;
  steps: Array<{
    name: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
    number: number;
    started_at: string | null;
    completed_at: string | null;
  }>;
}

interface GitHubJobsResponse {
  total_count: number;
  jobs: GitHubJob[];
}

// =============================================================================
// API Client
// =============================================================================

async function fetchGitHub<T>(endpoint: string): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}${endpoint}`, { headers });

  if (!response.ok) {
    if (response.status === 403) {
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      if (rateLimitReset) {
        const resetTime = new Date(parseInt(rateLimitReset) * 1000);
        throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`);
      }
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// Helper Functions
// =============================================================================

function mapGitHubStatus(
  status: GitHubWorkflowRun['status'],
  conclusion: GitHubWorkflowRun['conclusion']
): PipelineStatus {
  if (status === 'completed') {
    switch (conclusion) {
      case 'success':
        return 'success';
      case 'failure':
      case 'timed_out':
        return 'failure';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'success'; // neutral, skipped, action_required
    }
  }
  if (status === 'queued' || status === 'waiting' || status === 'pending') {
    return 'queued';
  }
  return 'in_progress';
}

function mapGitHubJobStatus(
  status: GitHubJob['status'],
  conclusion: GitHubJob['conclusion']
): JobInfo['status'] {
  if (status === 'completed') {
    switch (conclusion) {
      case 'success':
        return 'success';
      case 'failure':
        return 'failure';
      case 'cancelled':
        return 'cancelled';
      case 'skipped':
        return 'skipped';
      default:
        return 'success';
    }
  }
  if (status === 'queued' || status === 'waiting') {
    return 'queued';
  }
  return 'in_progress';
}

function mapGitHubStepStatus(
  status: 'queued' | 'in_progress' | 'completed',
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null
): StepInfo['status'] {
  if (status === 'completed') {
    switch (conclusion) {
      case 'success':
        return 'success';
      case 'failure':
        return 'failure';
      case 'cancelled':
        return 'cancelled';
      case 'skipped':
        return 'skipped';
      default:
        return 'success';
    }
  }
  return 'in_progress';
}

// =============================================================================
// GitHub API Functions
// =============================================================================

/**
 * Fetch recent workflow runs for a repository
 */
export async function getGitHubWorkflowRuns(
  owner: string,
  repo: string,
  options?: {
    per_page?: number;
    status?: 'queued' | 'in_progress' | 'completed';
    branch?: string;
  }
): Promise<GitHubWorkflowRun[]> {
  const params = new URLSearchParams();
  params.set('per_page', String(options?.per_page || 20));
  if (options?.status) params.set('status', options.status);
  if (options?.branch) params.set('branch', options.branch);

  const response = await fetchGitHub<{ workflow_runs: GitHubWorkflowRun[] }>(
    `/repos/${owner}/${repo}/actions/runs?${params}`
  );

  return response.workflow_runs;
}

/**
 * Fetch active (in-progress or queued) workflow runs
 */
export async function getActiveWorkflowRuns(
  owner: string,
  repo: string
): Promise<GitHubWorkflowRun[]> {
  // Fetch both queued and in_progress runs
  const [queuedRuns, inProgressRuns] = await Promise.all([
    getGitHubWorkflowRuns(owner, repo, { status: 'queued', per_page: 10 }),
    getGitHubWorkflowRuns(owner, repo, { status: 'in_progress', per_page: 10 }),
  ]);

  return [...queuedRuns, ...inProgressRuns];
}

/**
 * Fetch a specific workflow run
 */
export async function getGitHubWorkflowRun(
  owner: string,
  repo: string,
  runId: number
): Promise<GitHubWorkflowRun> {
  return fetchGitHub<GitHubWorkflowRun>(
    `/repos/${owner}/${repo}/actions/runs/${runId}`
  );
}

/**
 * Fetch jobs for a workflow run
 */
export async function getGitHubWorkflowJobs(
  owner: string,
  repo: string,
  runId: number
): Promise<GitHubJob[]> {
  const response = await fetchGitHub<GitHubJobsResponse>(
    `/repos/${owner}/${repo}/actions/runs/${runId}/jobs`
  );
  return response.jobs;
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Convert GitHub workflow run to PipelineIndexEntry
 */
export function transformToIndexEntry(run: GitHubWorkflowRun): PipelineIndexEntry {
  const now = new Date();
  const startTime = new Date(run.run_started_at || run.created_at);
  const completedAt = run.status === 'completed' ? run.updated_at : null;
  const duration = completedAt 
    ? Math.round((new Date(completedAt).getTime() - startTime.getTime()) / 1000)
    : Math.round((now.getTime() - startTime.getTime()) / 1000);

  return {
    run_id: run.id,
    status: mapGitHubStatus(run.status, run.conclusion),
    branch: run.head_branch,
    commit_sha: run.head_sha,
    commit_message: run.head_commit?.message?.split('\n')[0] || 'No commit message',
    actor: run.actor.login,
    started_at: run.run_started_at || run.created_at,
    completed_at: completedAt || new Date().toISOString(),
    duration_seconds: duration,
    pull_request_number: run.pull_requests[0]?.number || null,
  };
}

/**
 * Convert GitHub workflow run to full PipelineRun
 */
export async function transformToPipelineRun(
  owner: string,
  repo: string,
  run: GitHubWorkflowRun
): Promise<PipelineRun> {
  // Fetch jobs for this run
  const githubJobs = await getGitHubWorkflowJobs(owner, repo, run.id);

  const now = new Date();
  const startTime = new Date(run.run_started_at || run.created_at);
  const completedAt = run.status === 'completed' ? run.updated_at : null;
  const duration = completedAt
    ? Math.round((new Date(completedAt).getTime() - startTime.getTime()) / 1000)
    : Math.round((now.getTime() - startTime.getTime()) / 1000);

  // Transform jobs
  const jobs: Record<string, JobInfo> = {};
  for (const job of githubJobs) {
    const jobStartTime = job.started_at ? new Date(job.started_at) : null;
    const jobEndTime = job.completed_at ? new Date(job.completed_at) : null;

    const steps: StepInfo[] = job.steps.map((step) => ({
      name: step.name,
      status: mapGitHubStepStatus(step.status, step.conclusion),
      started_at: step.started_at,
      completed_at: step.completed_at,
      number: step.number,
    }));

    const failedSteps = job.steps
      .filter((s) => s.conclusion === 'failure')
      .map((s) => s.name);

    jobs[job.name] = {
      status: mapGitHubJobStatus(job.status, job.conclusion),
      started_at: job.started_at,
      completed_at: job.completed_at,
      duration_seconds: jobStartTime && jobEndTime
        ? Math.round((jobEndTime.getTime() - jobStartTime.getTime()) / 1000)
        : null,
      steps,
      failed_steps: failedSteps,
      url: job.html_url,
    };
  }

  // Build pull request info
  const prInfo = run.pull_requests[0];
  const pullRequest = prInfo
    ? {
        number: prInfo.number,
        title: `PR #${prInfo.number}`, // Title not available in run data
        url: prInfo.url.replace('api.github.com/repos', 'github.com'),
        base_branch: prInfo.base.ref,
        head_branch: prInfo.head.ref,
      }
    : null;

  const status = mapGitHubStatus(run.status, run.conclusion);

  return {
    run_id: run.id,
    repository: `${owner}/${repo}`,
    workflow: run.name,
    workflow_file: run.path,
    trigger: run.event as PipelineRun['trigger'],
    branch: run.head_branch,
    commit: {
      sha: run.head_sha,
      message: run.head_commit?.message?.split('\n')[0] || 'No commit message',
      author: run.head_commit?.author?.email || run.actor.login,
      timestamp: run.head_commit?.timestamp || run.created_at,
    },
    pull_request: pullRequest,
    actor: run.actor.login,
    started_at: run.run_started_at || run.created_at,
    completed_at: completedAt || new Date().toISOString(),
    duration_seconds: duration,
    status,
    jobs,
    // Live runs don't have corrective actions (generated after completion)
    corrective_actions: status === 'in_progress' || status === 'queued'
      ? []
      : generateLiveCorrectiveActions(jobs),
    links: {
      workflow_run: run.html_url,
      diff: pullRequest
        ? `https://github.com/${owner}/${repo}/compare/${pullRequest.base_branch}...${pullRequest.head_branch}`
        : `https://github.com/${owner}/${repo}/commit/${run.head_sha}`,
      repository: `https://github.com/${owner}/${repo}`,
    },
  };
}

/**
 * Generate basic corrective actions for live runs with failures
 */
function generateLiveCorrectiveActions(jobs: Record<string, JobInfo>) {
  const actions = [];

  for (const [jobName, job] of Object.entries(jobs)) {
    if (job.status === 'failure') {
      actions.push({
        severity: 'error' as const,
        job: jobName,
        title: `${jobName} failed`,
        description: job.failed_steps.length > 0
          ? `Failed steps: ${job.failed_steps.join(', ')}`
          : 'Job failed - check logs for details',
        suggestion: 'Review the job logs on GitHub for more details',
        doc_link: job.url,
      });
    }
  }

  return actions;
}

// =============================================================================
// Check if GitHub API is available
// =============================================================================

export function isGitHubApiEnabled(): boolean {
  // Only enable live GitHub API calls if we have a token configured
  // This prevents 404 errors for private repositories
  return !!GITHUB_TOKEN;
}

export function hasGitHubToken(): boolean {
  return !!GITHUB_TOKEN;
}
