import { useQuery } from '@tanstack/react-query';
import {
  getLatestRuns,
  getPipelineRun,
  getRecentRunsAcrossRepos,
  getAllRepositoriesLatest,
  calculateStats,
} from '@/api/pipelines';
import type { PipelineIndexEntry } from '@/types/pipeline';

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
// Hooks
// =============================================================================

/**
 * Fetch latest runs for a specific repository
 */
export function useLatestRuns(repository: string) {
  return useQuery({
    queryKey: pipelineKeys.list(repository),
    queryFn: () => getLatestRuns(repository),
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch a specific pipeline run
 */
export function usePipelineRun(repository: string, runId: string) {
  return useQuery({
    queryKey: pipelineKeys.detail(repository, runId),
    queryFn: () => getPipelineRun(repository, runId),
    staleTime: 1000 * 60 * 5, // 5 minutes (completed runs don't change)
    enabled: !!repository && !!runId,
  });
}

/**
 * Fetch recent runs across all repositories
 */
export function useRecentRuns(limit: number = 50) {
  return useQuery({
    queryKey: [...pipelineKeys.recent(), limit],
    queryFn: () => getRecentRunsAcrossRepos(limit),
    staleTime: 1000 * 30, // 30 seconds
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
