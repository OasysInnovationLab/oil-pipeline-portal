import { Shield, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AtlasTier } from '@/types/pipeline';

interface TierBadgeProps {
  tier: AtlasTier | undefined;
  /** When true, `none` renders as a muted badge instead of being hidden. */
  showUntiered?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Atlas assurance tier, as shown to a viewer who does not have GitHub access.
 *
 * Deliberately ordered by escalating visual weight — Vector reads as neutral,
 * Prime as strongest — so the ladder is legible at a glance without needing the
 * legend. `none` is muted rather than alarming: an untiered project is a normal
 * state, not a failure.
 */
const tierConfig: Record<
  AtlasTier,
  { icon: typeof Shield; label: string; title: string; className: string }
> = {
  none: {
    icon: ShieldOff,
    label: 'Untiered',
    title: 'No assurance tier declared — bring-your-own configuration',
    className: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  },
  vector: {
    icon: Shield,
    label: 'Vector',
    title: 'Atlas Tier 1 — baseline controls: scanning and policy checks',
    className: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  },
  grid: {
    icon: ShieldAlert,
    label: 'Grid',
    title: 'Atlas Tier 2 — structured governance: controlled promotion, deeper enforcement',
    className: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  prime: {
    icon: ShieldCheck,
    label: 'Prime',
    title: 'Atlas Tier 3 — highest assurance: full evidence and audit rigour',
    className: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
};

export function TierBadge({
  tier,
  showUntiered = false,
  size = 'sm',
  className,
}: TierBadgeProps) {
  // Older runs predate tier reporting; absent is not the same as untiered, so
  // render nothing rather than implying an assertion that was never made.
  if (!tier) return null;
  if (tier === 'none' && !showUntiered) return null;

  const config = tierConfig[tier] ?? tierConfig.none;
  const Icon = config.icon;

  return (
    <span
      title={config.title}
      className={cn(
        'inline-flex items-center gap-1 rounded border font-medium',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1',
        config.className,
        className
      )}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {config.label}
    </span>
  );
}
