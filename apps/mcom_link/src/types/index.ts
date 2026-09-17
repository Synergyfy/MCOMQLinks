export type CTAType = 'claim' | 'redeem' | 'redirect'
export type Season = 'all' | 'winter' | 'spring' | 'summer' | 'autumn'
export type OfferStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired'

export interface Offer {
    id: string
    businessName: string
    headline: string
    description: string
    mediaType: 'image' | 'video'
    imageUrl: string
    videoUrl?: string
    ctaType: CTAType
    ctaLabel: string
    // Real backend field (backend uses `leadDestination`, not `redirectUrl`)
    leadDestination?: string
    redirectUrl?: string
    redemptionCode?: string
    redemptionInstructions?: string
    isPremium: boolean
    status: OfferStatus
    visibility: 'national' | 'hyperlocal' | 'nearby'
    targetPostcode?: string
    // Backend counters & timestamps. The dashboard endpoint nests these under
    // `performance`, while the storefront returns them at the top level.
    scans?: number
    claims?: number
    activeViewers?: number
    createdAt?: string
    updatedAt?: string
    startDate: string // ISO date string
    endDate: string   // ISO date string
    rejectionReason?: string
    // Frontend-only extras (mock data / admin UI); not sent to the backend
    season?: Season
    exposureType?: 'national' | 'hyperlocal' | 'nearby'
    rotatorWeight?: number // 0-100 percentage
    targetRadius?: number // in km, for nearby
    billingStatus?: 'active' | 'suspended' | 'pending'
    googleMapsLocation?: string
    isActive?: boolean
    performance?: {
        scans: number
        claims: number
    }
    claimFields?: ClaimField[]
    activities?: EngagementActivity[]
}

export interface EngagementActivity {
    id: string
    visitorId: string
    type: 'view' | 'click' | 'directions' | 'claim' | 'save'
    timestamp: string
    duration?: number
    location?: string
    device?: string
    interestScore: 'low' | 'medium' | 'high' | 'verified'
    verifiedData?: {
        email?: string
        phone?: string
    }
}

export interface ClaimField {
    name: string
    label: string
    type: 'text' | 'email' | 'tel'
    required: boolean
    placeholder: string
}

export interface AgentProfile {
    id: string;
    name: string;
    email: string;
    role: 'Field Agent' | 'Senior Account Manager';
    avatarUrl?: string;
}

export interface AgentPortfolio {
    agentId: string;
    businessIds: string[];
    targets: {
        newBusinesses: number;
        newBusinessesGoal: number;
        activeOffers: number;
        activeOffersGoal: number;
    };
}

export interface CommLog {
    id: string;
    businessId: string;
    date: string;
    note: string;
    type: 'call' | 'meeting' | 'email';
}

export interface BusinessProfile {
    id: string;
    name: string;
    description: string;
    logoUrl?: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    primaryColor: string;
    secondaryColor: string;
    ownerName: string;
    plan: 'Basic' | 'Premium';
    subscriptionStatus: 'active' | 'suspended';
    offers: string[];
}

// Session user stored in localStorage. Includes Central Hub SSO fields when the
// user authenticated via MCOM Solutions.
export interface SessionUser {
    id: string;
    email: string;
    name: string;
    role: string;
    postalCode?: string;
    mcomUserId?: string;
    mcomRole?: string;
    permissions?: Record<string, boolean>;
    membershipLevel?: string;
    membershipStatus?: string;
}

// MCOM Ecosystem: centrally-managed plan (Plan CRUD & centralized payments)
export type BillingCycle = 'monthly' | 'quarterly' | 'annual'
export type PaymentProvider = 'stripe' | 'paypal' | 'wallet' | 'mcom_wallet'
export type PlanType = 'STANDARD' | 'TRIAL' | 'SEASONAL'
export type PlanTierLevelName = 'STANDARD' | 'PRO' | 'PRO_PLUS'

export interface PlanVariantConfiguration {
    quotas: {
        maxListings?: number;
        maxOffers?: number;
        maxLocations?: number;
        maxActiveCampaigns?: number;
        allowProductListing?: boolean;
        allowServiceListing?: boolean;
        maxProducts?: number;
        maxServices?: number;
        maxGiftCardTemplates?: number;
        maxCouponTemplates?: number;
        maxLoyaltyPrograms?: number;
        maxImagesPerListing?: number;
        featuredListingAllowance?: number;
        allowNearbyExpansion?: boolean;
        allowNationalNetwork?: boolean;
        [key: string]: any;
    };
    featureFlags: {
        priorityInSearch?: boolean;
        priorityBoost?: boolean;
        advancedAnalytics?: boolean;
        dedicatedSupport?: boolean;
        allowCustomBranding?: boolean;
        allowGroupCreation?: boolean;
        allowThirdPartyPromotion?: boolean;
        allowAutoRollover?: boolean;
        allowExpoAccess?: boolean;
        [key: string]: any;
    };
    disabledNavIds?: string[];
}

export interface PlanTierLevel {
    id: string;
    name: PlanTierLevelName;
    sortOrder: number;
    durationDays: number | null;
    isCalendarYear: boolean;
}

export interface PlanPrice {
    id: string;
    amount: number;
    currency: string;
    stripePriceId?: string;
    paypalPlanId?: string;
    isActive: boolean;
    effectiveFrom: string;
    effectiveTo?: string | null;
}

export interface PlanVariant {
    id: string;
    planId: string;
    tierLevelId: string;
    tier: PlanTierLevelName;
    tierLevel?: PlanTierLevel;
    isActive: boolean;
    features: string[];
    limitations: string[];
    configuration: PlanVariantConfiguration;
    price: number;
    activePrice?: PlanPrice | null;
    plan?: Plan;
    createdAt?: string;
    updatedAt?: string;
}

export interface Plan {
    id: string
    name: string
    slug: string
    description?: string
    tagline?: string
    bestFor?: string
    isFree?: boolean
    monthlyPrice: number
    quarterlyPrice: number
    annualPrice: number
    features: string[]
    limitations?: string[]
    configuration: PlanVariantConfiguration
    isActive: boolean
    isDefault: boolean
    type: PlanType
    trialDuration?: number
    seasonId?: string
    variants: PlanVariant[]
    stripeMonthlyPriceId?: string
    stripeQuarterlyPriceId?: string
    stripeAnnualPriceId?: string
    paypalMonthlyPlanId?: string
    paypalQuarterlyPlanId?: string
    paypalAnnualPlanId?: string
    createdAt?: string
    updatedAt?: string
}

export interface Membership {
    id: string;
    userId: string;
    planVariantId: string;
    planId?: string;
    planName: string;
    displayName: string;
    status?: 'ACTIVE' | 'EXPIRED' | string;
    tier: PlanTierLevelName;
    tierLabel: string;
    isActive: boolean;
    isTrial: boolean;
    startDate: string;
    expiresAt: string;
    endDate: string;
    price: number;
    currency: string;
    features: string[];
    configuration: PlanVariantConfiguration;
    planVariant?: PlanVariant | null;
    plan?: Plan | null;
    payment?: {
        id: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        transactionId: string;
    } | null;
    payments?: Array<{
        id: string;
        userId: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        transactionId: string;
        tierLevel?: string;
        status: string;
        createdAt: string;
    }>;
}

export interface PurchasedPackage {
    id?: string
    planId?: string
    planVariantId?: string
    planName?: string
    packageName?: string
    tier?: string
    billingCycle?: BillingCycle
    status?: 'active' | 'cancelled' | 'expired'
    expiresAt?: string
}

