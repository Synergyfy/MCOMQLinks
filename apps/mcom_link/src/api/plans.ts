import { api } from './apiClient'
import type { Plan, PlanTierLevelName, PlanVariantConfiguration, Membership } from '../types'

export interface SchemaDescriptor {
    key: string
    label: string
    type: 'number' | 'boolean'
    unlimited?: boolean
}

export interface PlanSchema {
    quotas: SchemaDescriptor[]
    featureFlags: SchemaDescriptor[]
}

export interface VariantInput {
    tier: PlanTierLevelName
    price: number
    features?: string[]
    limitations?: string[]
    configuration?: PlanVariantConfiguration
    stripePriceId?: string
    paypalPlanId?: string
}

export interface PlanInput {
    name: string
    slug?: string
    description?: string
    tagline?: string
    bestFor?: string
    isFree?: boolean
    isActive?: boolean
    isDefault?: boolean
    type?: 'STANDARD' | 'TRIAL' | 'SEASONAL'
    trialDuration?: number
    seasonId?: string
    variants: VariantInput[]
    // Backward compatibility fields
    monthlyPrice?: number
    quarterlyPrice?: number
    annualPrice?: number
    features?: string[]
    limitations?: string[]
    configuration?: PlanVariantConfiguration
    stripeMonthlyPriceId?: string
    stripeQuarterlyPriceId?: string
    stripeAnnualPriceId?: string
    paypalMonthlyPlanId?: string
    paypalQuarterlyPlanId?: string
    paypalAnnualPlanId?: string
}

export async function getPlans(): Promise<Plan[]> {
    return api.get<Plan[]>('/admin/plans')
}

export async function getPublicPlans(): Promise<Plan[]> {
    return api.get<Plan[]>('/api/v1/plans')
}

export async function getPublicPlanSchema(): Promise<PlanSchema> {
    return api.get<PlanSchema>('/api/v1/plans/schema')
}

export async function getPlanSchema(): Promise<PlanSchema> {
    return api.get<PlanSchema>('/admin/plans/schema')
}

export async function getPlan(id: string): Promise<Plan> {
    return api.get<Plan>(`/admin/plans/${id}`)
}

export async function createPlan(input: PlanInput): Promise<Plan> {
    return api.post<Plan>('/admin/plans', input)
}

export async function updatePlan(id: string, input: Partial<PlanInput>): Promise<Plan> {
    return api.patch<Plan>(`/admin/plans/${id}`, input)
}

export async function repriceVariant(
    variantId: string,
    data: { amount: number; currency?: string; stripePriceId?: string; paypalPlanId?: string },
): Promise<any> {
    return api.post(`/admin/plans/variants/${variantId}/prices`, data)
}

export async function deletePlan(id: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/admin/plans/${id}`)
}

export async function getActiveMembership(): Promise<Membership | null> {
    try {
        return await api.get<Membership>('/api/v1/mcom/packages/purchase/membership')
    } catch {
        return null
    }
}