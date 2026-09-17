import { useMembership } from '../context/MembershipContext';
import type { Membership, PlanTierLevelName } from '../types';

export interface UseActiveMembershipResult {
  membership: Membership | null;
  loading: boolean;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  quotas: Record<string, number | undefined>;
  flags: Record<string, boolean | undefined>;
  tier: PlanTierLevelName | null;
  planName: string;
  refresh: () => Promise<void>;
}

export function useActiveMembership(): UseActiveMembershipResult {
  const ctx = useMembership();

  return {
    membership: ctx.membership,
    loading: ctx.loading,
    isActive: ctx.isActive,
    isExpired: ctx.isExpired,
    daysRemaining: ctx.daysRemaining,
    quotas: ctx.quotas,
    flags: ctx.flags,
    tier: ctx.tier,
    planName: ctx.planName,
    refresh: ctx.refresh,
  };
}

