import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PipelineIndexEntry, PipelineTransition, PipelineStatus } from '@/types/pipeline';
import { pipelineKeys } from './usePipelines';

interface UseTransitionsOptions {
  onTransition?: (transition: PipelineTransition) => void;
  playSound?: boolean;
}

/**
 * Hook to detect and animate pipeline status transitions
 */
export function usePipelineTransitions(
  runs: (PipelineIndexEntry & { repository: string })[] | undefined,
  options: UseTransitionsOptions = {}
) {
  const { onTransition, playSound = false } = options;
  const [recentTransitions, setRecentTransitions] = useState<PipelineTransition[]>([]);
  const previousRunsRef = useRef<Map<string, PipelineStatus>>(new Map());
  const queryClient = useQueryClient();

  // Detect transitions
  useEffect(() => {
    if (!runs) return;

    const newTransitions: PipelineTransition[] = [];
    const currentStatuses = new Map<string, PipelineStatus>();

    for (const run of runs) {
      const key = `${run.repository}-${run.run_id}`;
      const previousStatus = previousRunsRef.current.get(key);
      const currentStatus = run.status;
      
      currentStatuses.set(key, currentStatus);

      // Detect transition from active to completed
      if (previousStatus && previousStatus !== currentStatus) {
        const isCompletionTransition = 
          (previousStatus === 'in_progress' || previousStatus === 'queued') &&
          (currentStatus === 'success' || currentStatus === 'failure' || currentStatus === 'cancelled');

        if (isCompletionTransition) {
          const transition: PipelineTransition = {
            run_id: run.run_id,
            repository: run.repository,
            from_status: previousStatus,
            to_status: currentStatus,
            timestamp: new Date().toISOString(),
            duration_seconds: run.duration_seconds,
          };
          
          newTransitions.push(transition);
        }
      }
    }

    // Update previous runs ref
    previousRunsRef.current = currentStatuses;

    // Handle transitions
    if (newTransitions.length > 0) {
      setRecentTransitions(prev => [...newTransitions, ...prev].slice(0, 10));
      
      // Call callback for each transition
      for (const transition of newTransitions) {
        onTransition?.(transition);
      }

      // Play sound if enabled
      if (playSound) {
        playTransitionSound(newTransitions[0].to_status);
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
    }
  }, [runs, onTransition, playSound, queryClient]);

  // Clear old transitions after 30 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      setRecentTransitions(prev => {
        const cutoff = Date.now() - 30000;
        return prev.filter(t => new Date(t.timestamp).getTime() > cutoff);
      });
    }, 30000);

    return () => clearTimeout(timeout);
  }, [recentTransitions]);

  const clearTransition = useCallback((runId: number) => {
    setRecentTransitions(prev => prev.filter(t => t.run_id !== runId));
  }, []);

  return {
    recentTransitions,
    clearTransition,
    hasNewCompletions: recentTransitions.some(t => 
      t.to_status === 'success' || t.to_status === 'failure'
    ),
  };
}

/**
 * Play a sound when a pipeline completes
 */
function playTransitionSound(status: PipelineStatus) {
  // Create a simple tone using Web Audio API
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    // Different sounds for success/failure
    if (status === 'success') {
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1047, ctx.currentTime + 0.1); // C6
    } else {
      oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
      oscillator.frequency.setValueAtTime(330, ctx.currentTime + 0.1); // E4
    }

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // Audio not supported or blocked
  }
}

/**
 * Hook to show toast notifications for pipeline transitions
 */
export function useTransitionToasts() {
  const showTransitionToast = useCallback((transition: PipelineTransition) => {
    const repo = transition.repository.split('/')[1];
    const status = transition.to_status;
    
    // Import dynamically to avoid SSR issues
    import('sonner').then(({ toast }) => {
      if (status === 'success') {
        toast.success(`Pipeline completed`, {
          description: `${repo} deployed successfully`,
          duration: 5000,
        });
      } else if (status === 'failure') {
        toast.error(`Pipeline failed`, {
          description: `${repo} deployment failed`,
          duration: 8000,
        });
      } else if (status === 'cancelled') {
        toast.warning(`Pipeline cancelled`, {
          description: `${repo} deployment was cancelled`,
          duration: 5000,
        });
      }
    });
  }, []);

  return { showTransitionToast };
}
