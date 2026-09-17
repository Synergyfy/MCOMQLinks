import { SetMetadata, applyDecorators } from '@nestjs/common';

export const REQUIRE_ACTIVE_SUBSCRIPTION_KEY = 'require_active_subscription';
export const REQUIRE_QUOTA_KEY = 'require_quota';
export const REQUIRE_FEATURE_KEY = 'require_feature';

/**
 * Enforces that the authenticated user must have an active, non-expired subscription.
 */
export const RequireActiveSubscription = () =>
  SetMetadata(REQUIRE_ACTIVE_SUBSCRIPTION_KEY, true);

/**
 * Enforces a specific quota validation (e.g. 'maxOffers', 'maxActiveCampaigns').
 */
export const RequireQuota = (quotaKey: string) =>
  applyDecorators(
    RequireActiveSubscription(),
    SetMetadata(REQUIRE_QUOTA_KEY, quotaKey),
  );

/**
 * Enforces that a specific feature flag is enabled on the active plan tier (e.g. 'advancedAnalytics', 'priorityBoost').
 */
export const RequireFeature = (featureKey: string) =>
  applyDecorators(
    RequireActiveSubscription(),
    SetMetadata(REQUIRE_FEATURE_KEY, featureKey),
  );
