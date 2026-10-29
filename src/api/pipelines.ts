import type {
  PipelineRun,
  PipelineIndexEntry,
  PipelineManifest,
} from '@/types/pipeline';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Repositories whose pipelines report here: every caller of the oil-sf-ci
// orchestrator, whose final `report` job writes each run to S3.
const REPOSITORIES = [
  'OasysInnovationLab/oil-perf-platform',
  'OasysInnovationLab/oil-bd-opal',
  'OasysInnovationLab/oil-docs',
  'OasysInnovationLab/oil-sf-demo',
  'OasysInnovationLab/oil-sf-demo-svc',
  'OasysInnovationLab/oil-sf--test-harness',
];

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
 * Fetch the latest pipeline runs for a repository. A run appears once it has
 * finished: the orchestrator's `report` job writes it to S3 as its last step.
 */
export async function getLatestRuns(repository: string): Promise<PipelineIndexEntry[]> {
  const runs = await getLatestRunsFromS3(repository);
  return [...runs].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
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
 * Fetch a specific pipeline run by ID
 */
export async function getPipelineRun(
  repository: string,
  runId: string | number
): Promise<PipelineRun> {
  const run = await getPipelineRunFromS3(repository, runId);
  if (!run) {
    throw new Error(`Run ${runId} not found`);
  }
  return run;
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
