import { useQuery } from '@tanstack/react-query';
import {
  getLatestRuns,
  getPipelineRun,
  getRecentRunsAcrossRepos,
  getAllRepositoriesLatest,
  calculateStats,
} from '@/api/pipelines';
import type { PipelineIndexEntry, PipelineRun } from '@/types/pipeline';

// =============================================================================
// Query Keys
// =============================================================================

export const pipelineKeys = {
  all: ['pipelines'] as const,
  lists: () => [...pipelineKeys.all, 'list'] as const,
  list: (repo: string) => [...pipelineKeys.lists(), repo] as const,
  details: () => [...pipelineKeys.all, 'detail'] as const,
  detail: (repo: string, runId: string) => [...pipelineKeys.details(), repo, runId] as const,
  recent: () => [...pipelineKeys.all, 'recent'] as const,
  allRepos: () => [...pipelineKeys.all, 'allRepos'] as const,
};

// =============================================================================
// Helper to check if data has active runs
// =============================================================================

function hasActiveRuns(runs: PipelineIndexEntry[] | undefined): boolean {
  if (!runs) return false;
  return runs.some(run => run.status === 'in_progress' || run.status === 'queued');
}

function isRunActive(run: PipelineRun | undefined): boolean {
  if (!run) return false;
  return run.status === 'in_progress' || run.status === 'queued';
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch latest runs for a specific repository
 */
export function useLatestRuns(repository: string) {
  const query = useQuery({
    queryKey: pipelineKeys.list(repository),
    queryFn: () => getLatestRuns(repository),
    staleTime: 1000 * 30, // 30 seconds
  });

  // Auto-refresh more frequently when there are active runs
  const refetchInterval = hasActiveRuns(query.data) ? 10000 : 60000;

  return useQuery({
    queryKey: pipelineKeys.list(repository),
    queryFn: () => getLatestRuns(repository),
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval,
  });
}

/**
 * Fetch a specific pipeline run
 */
export function usePipelineRun(repository: string, runId: string) {
  const query = useQuery({
    queryKey: pipelineKeys.detail(repository, runId),
    queryFn: () => getPipelineRun(repository, runId),
    staleTime: 1000 * 10, // 10 seconds for responsiveness
    enabled: !!repository && !!runId,
  });

  // Auto-refresh more frequently for in-progress runs
  const refetchInterval = isRunActive(query.data) ? 5000 : undefined; // 5 seconds for active, none for completed

  return useQuery({
    queryKey: pipelineKeys.detail(repository, runId),
    queryFn: () => getPipelineRun(repository, runId),
    staleTime: 1000 * 10,
    refetchInterval,
    enabled: !!repository && !!runId,
  });
}

/**
 * Fetch recent runs across all repositories
 */
export function useRecentRuns(limit: number = 50) {
  const query = useQuery({
    queryKey: [...pipelineKeys.recent(), limit],
    queryFn: () => getRecentRunsAcrossRepos(limit),
    staleTime: 1000 * 15, // 15 seconds
  });

  // Auto-refresh more frequently when there are active runs
  const refetchInterval = hasActiveRuns(query.data) ? 10000 : 30000;

  return useQuery({
    queryKey: [...pipelineKeys.recent(), limit],
    queryFn: () => getRecentRunsAcrossRepos(limit),
    staleTime: 1000 * 15,
    refetchInterval,
  });
}

/**
 * Fetch latest runs for all repositories
 */
export function useAllRepositoriesLatest() {
  return useQuery({
    queryKey: pipelineKeys.allRepos(),
    queryFn: getAllRepositoriesLatest,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Calculate statistics for a list of runs
 */
export function usePipelineStats(runs: PipelineIndexEntry[] | undefined) {
  if (!runs) {
    return {
      totalRuns: 0,
      successRate: 0,
      averageDuration: 0,
      failuresByJob: {},
    };
  }
  return calculateStats(runs);
}
