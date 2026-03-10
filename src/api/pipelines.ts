import type {
  PipelineRun,
  PipelineIndexEntry,
  PipelineManifest,
} from '@/types/pipeline';
import {
  getActiveWorkflowRuns,
  getGitHubWorkflowRun,
  transformToIndexEntry,
  transformToPipelineRun,
  isGitHubApiEnabled,
} from './github';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// List of repositories to display (can be fetched from a config endpoint later)
const REPOSITORIES = [
  'OasysInnovationLab/uscg-alc-ce-tip-wfe',
  'OasysInnovationLab/uscg-alc-ce-tip-ms',
  'OasysInnovationLab/uscg-alc--service-template',
  'OasysInnovationLab/uscg-alc--ci-test-harness',
  'OasysInnovationLab/oil-ai-agent-foundry',
  'OasysInnovationLab/oil-keycloak',
];

// Cache for rate limit tracking
let githubRateLimited = false;
let rateLimitResetTime: Date | null = null;

// =============================================================================
// API Client
// =============================================================================

async function fetchJson<T>(url: string): Promise<T> {
  // Add cache-busting timestamp to prevent stale data
  const cacheBuster = `_t=${Date.now()}`;
  const urlWithCache = url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
  
  const response = await fetch(urlWithCache, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Not found');
    }
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// =============================================================================
// Pipeline API Functions
// =============================================================================

/**
 * Fetch the latest pipeline runs for a repository from S3
 */
export async function getLatestRunsFromS3(repository: string): Promise<PipelineIndexEntry[]> {
  const url = `${API_BASE}/index/${repository}/latest.json`;
  
  try {
    return await fetchJson<PipelineIndexEntry[]>(url);
  } catch (error) {
    if ((error as Error).message === 'Not found') {
      return [];
    }
    throw error;
  }
}

/**
 * Fetch live runs from GitHub API
 */
async function getLiveRunsFromGitHub(repository: string): Promise<PipelineIndexEntry[]> {
  // Check rate limit status
  if (githubRateLimited && rateLimitResetTime && new Date() < rateLimitResetTime) {
    console.log('GitHub API rate limited, skipping live data fetch');
    return [];
  }

  if (!isGitHubApiEnabled()) {
    return [];
  }

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) return [];

  try {
    const activeRuns = await getActiveWorkflowRuns(owner, repo);
    githubRateLimited = false;
    return activeRuns.map(transformToIndexEntry);
  } catch (error) {
    if ((error as Error).message.includes('rate limit')) {
      githubRateLimited = true;
      // Parse reset time from error message if available
      const match = (error as Error).message.match(/Resets at (.+)/);
      if (match) {
        rateLimitResetTime = new Date(match[1]);
      } else {
        rateLimitResetTime = new Date(Date.now() + 60000); // Default 1 minute
      }
    }
    console.warn(`Failed to fetch live runs from GitHub for ${repository}:`, error);
    return [];
  }
}

/**
 * Fetch the latest pipeline runs for a repository (merges S3 + live GitHub data)
 */
export async function getLatestRuns(repository: string): Promise<PipelineIndexEntry[]> {
  // Fetch both S3 data and live GitHub data in parallel
  const [s3Runs, liveRuns] = await Promise.all([
    getLatestRunsFromS3(repository),
    getLiveRunsFromGitHub(repository),
  ]);

  // Create a map of run_id to run data
  const runMap = new Map<number, PipelineIndexEntry>();

  // Add S3 runs first (these are the source of truth for completed runs)
  for (const run of s3Runs) {
    runMap.set(run.run_id, run);
  }

  // Override with live runs (more up-to-date for in-progress/queued)
  // But only if the run is still active
  for (const liveRun of liveRuns) {
    const existingRun = runMap.get(liveRun.run_id);
    if (!existingRun) {
      // New run not in S3 yet
      runMap.set(liveRun.run_id, liveRun);
    } else if (liveRun.status === 'in_progress' || liveRun.status === 'queued') {
      // Update with live status if still running
      runMap.set(liveRun.run_id, { ...existingRun, ...liveRun });
    }
    // If live run is completed but S3 has it, prefer S3 (has corrective actions)
  }

  // Sort by started_at descending
  return Array.from(runMap.values())
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

/**
 * Fetch a specific pipeline run by ID from S3
 */
async function getPipelineRunFromS3(
  repository: string,
  runId: string | number
): Promise<PipelineRun | null> {
  const url = `${API_BASE}/runs/${repository}/${runId}.json`;
  try {
    return await fetchJson<PipelineRun>(url);
  } catch (error) {
    if ((error as Error).message === 'Not found') {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch a specific pipeline run by ID (prefers S3, falls back to GitHub for live runs)
 */
export async function getPipelineRun(
  repository: string,
  runId: string | number
): Promise<PipelineRun> {
  const [owner, repo] = repository.split('/');
  const numericRunId = typeof runId === 'string' ? parseInt(runId, 10) : runId;

  // First, try to get from S3 (source of truth for completed runs)
  const s3Run = await getPipelineRunFromS3(repository, runId);

  // If S3 has the run and it's completed, return it (has corrective actions)
  if (s3Run && (s3Run.status === 'success' || s3Run.status === 'failure' || s3Run.status === 'cancelled')) {
    return s3Run;
  }

  // For in-progress/queued runs, or runs not in S3, fetch live from GitHub
  if (isGitHubApiEnabled() && !githubRateLimited) {
    try {
      const githubRun = await getGitHubWorkflowRun(owner, repo, numericRunId);
      const liveRun = await transformToPipelineRun(owner, repo, githubRun);
      
      // If we have S3 data, merge corrective actions if available
      if (s3Run?.corrective_actions?.length) {
        liveRun.corrective_actions = s3Run.corrective_actions;
      }
      
      return liveRun;
    } catch (error) {
      console.warn(`Failed to fetch live run from GitHub:`, error);
      // Fall back to S3 data if available
      if (s3Run) {
        return s3Run;
      }
      throw new Error(`Run ${runId} not found`);
    }
  }

  // If GitHub is unavailable but we have S3 data, return it
  if (s3Run) {
    return s3Run;
  }

  throw new Error(`Run ${runId} not found`);
}

/**
 * Fetch the manifest for a repository (all run IDs)
 */
export async function getManifest(repository: string): Promise<PipelineManifest> {
  const url = `${API_BASE}/index/${repository}/manifest.json`;
  return fetchJson<PipelineManifest>(url);
}

/**
 * Fetch latest runs for all configured repositories
 */
export async function getAllRepositoriesLatest(): Promise<
  { repository: string; runs: PipelineIndexEntry[] }[]
> {
  const results = await Promise.allSettled(
    REPOSITORIES.map(async (repo) => ({
      repository: repo,
      runs: await getLatestRuns(repo),
    }))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<{ repository: string; runs: PipelineIndexEntry[] }> => 
      r.status === 'fulfilled'
    )
    .map((r) => r.value)
    .filter((r) => r.runs.length > 0);
}

/**
 * Get all recent runs across all repositories, sorted by date
 */
export async function getRecentRunsAcrossRepos(limit: number = 50): Promise<
  (PipelineIndexEntry & { repository: string })[]
> {
  const allRepos = await getAllRepositoriesLatest();
  
  const allRuns = allRepos.flatMap(({ repository, runs }) =>
    runs.map((run) => ({ ...run, repository }))
  );

  return allRuns
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, limit);
}

/**
 * Get list of available repositories
 */
export function getRepositories(): string[] {
  return REPOSITORIES;
}

// =============================================================================
// Statistics
// =============================================================================

export interface PipelineStats {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  failuresByJob: Record<string, number>;
}

export function calculateStats(runs: PipelineIndexEntry[]): PipelineStats {
  if (runs.length === 0) {
    return {
      totalRuns: 0,
      successRate: 0,
      averageDuration: 0,
      failuresByJob: {},
    };
  }

  const successCount = runs.filter((r) => r.status === 'success').length;
  const totalDuration = runs.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);

  return {
    totalRuns: runs.length,
    successRate: Math.round((successCount / runs.length) * 100),
    averageDuration: Math.round(totalDuration / runs.length),
    failuresByJob: {}, // Would need full run data to calculate
  };
}
