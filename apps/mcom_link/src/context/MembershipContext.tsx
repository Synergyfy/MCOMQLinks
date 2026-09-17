import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../api/apiClient';
import { getActiveMembership } from '../api/plans';
import type { Membership, PlanTierLevelName, PlanVariantConfiguration } from '../types';

export interface BusinessProfileState {
  name?: string;
  logoUrl?: string;
  ownerName?: string;
  plan?: string;
  subscriptionStatus?: string;
}

export interface MembershipContextType {
  membership: Membership | null;
  profile: BusinessProfileState;
  loading: boolean;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  quotas: Record<string, number | undefined>;
  flags: Record<string, boolean | undefined>;
  tier: PlanTierLevelName | null;
  planName: string;
  effectivePlanName: string | null;
  effectiveStatus: string;
  isPlanless: boolean;
  refresh: () => Promise<void>;
}

const MembershipContext = createContext<MembershipContextType | null>(null);

export const MembershipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [profile, setProfile] = useState<BusinessProfileState>(() => {
    // Initial sync from local storage to avoid layout flash
    const mockPlan = localStorage.getItem('mock_user_plan');
    const mockStatus = localStorage.getItem('mock_user_status');
    return {
      plan: mockPlan || 'None',
      subscriptionStatus: mockStatus || 'pending',
    };
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [membershipData, profileData] = await Promise.all([
        getActiveMembership().catch(() => null),
        api.get<any>('/dashboard/settings').catch(() => null),
      ]);

      if (membershipData) {
        setMembership(membershipData);
      }

      const mockPlan = localStorage.getItem('mock_user_plan');
      const mockStatus = localStorage.getItem('mock_user_status');

      if (profileData) {
        setProfile({
          name: profileData.name,
          logoUrl: profileData.logoUrl,
          ownerName: profileData.ownerName,
          plan: mockPlan || profileData.plan || (membershipData?.displayName ? membershipData.displayName : 'None'),
          subscriptionStatus: mockStatus || profileData.subscriptionStatus || (membershipData?.isActive ? 'active' : 'pending'),
        });

        if (profileData.subscriptionStatus === 'active' && profileData.plan && profileData.plan !== 'None') {
          try {
            const stored = localStorage.getItem('user');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (!parsed.permissions?.canAccess_links) {
                parsed.permissions = { ...(parsed.permissions || {}), canAccess_links: true };
                localStorage.setItem('user', JSON.stringify(parsed));
              }
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to load membership/profile context:', err);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const handleUpdate = () => {
      fetchAll();
    };

    window.addEventListener('profile-updated', handleUpdate);
    window.addEventListener('membership-updated', handleUpdate);

    return () => {
      window.removeEventListener('profile-updated', handleUpdate);
      window.removeEventListener('membership-updated', handleUpdate);
    };
  }, [fetchAll]);

  const now = new Date();
  const expiresAt = membership?.expiresAt ? new Date(membership.expiresAt) : null;
  
  const isExpired = Boolean(
    expiresAt && expiresAt.getTime() <= now.getTime()
  );

  const isActive = Boolean(
    membership &&
    membership.isActive &&
    !isExpired
  );

  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const configuration: PlanVariantConfiguration = membership?.configuration || {
    quotas: {},
    featureFlags: {},
  };

  const quotas = configuration.quotas || {};
  const flags = configuration.featureFlags || {};
  const tier = membership?.tier || null;
  const planName = membership?.planName || membership?.displayName || 'No Active Plan';

  const effectivePlanName = membership?.displayName || (profile.plan && profile.plan !== 'None' ? profile.plan : null);
  const effectiveStatus = isExpired ? 'expired' : isActive ? 'active' : profile.subscriptionStatus || 'pending';
  const isPlanless = (!isActive || isExpired) && (!profile.plan || profile.plan === 'None');

  return (
    <MembershipContext.Provider
      value={{
        membership,
        profile,
        loading: loading && !hasLoadedOnce,
        isActive,
        isExpired,
        daysRemaining,
        quotas,
        flags,
        tier,
        planName,
        effectivePlanName,
        effectiveStatus,
        isPlanless,
        refresh: fetchAll,
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
};

export function useMembership(): MembershipContextType {
  const ctx = useContext(MembershipContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    return {
      membership: null,
      profile: {},
      loading: false,
      isActive: true,
      isExpired: false,
      daysRemaining: 0,
      quotas: {},
      flags: {},
      tier: null,
      planName: 'Standard Plan',
      effectivePlanName: 'Standard Plan',
      effectiveStatus: 'active',
      isPlanless: false,
      refresh: async () => {},
    };
  }
  return ctx;
}
