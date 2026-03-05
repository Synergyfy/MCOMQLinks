// Rotator Configuration Store (Mock)
// Stores per-location settings: Type, Fallback, and custom sequence of offers

export type RotationType = 'sequential' | 'random' | 'scarcity' | 'split'
export type FallbackBehavior = 'default' | 'link' | 'expired'

export interface RotatorConfig {
    locationId: string
    type: RotationType
    fallbackBehavior: FallbackBehavior
    customLink?: string
    offerSequence: string[] // Array of offer IDs in order
    weights: Record<string, number> // Offer ID -> weight (for random)
    scarcityLimits: Record<string, number> // Offer ID -> max clicks
}

const STORAGE_KEY_PREFIX = 'mcom_config_'

export const getRotatorConfig = (locationId: string): RotatorConfig => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${locationId}`)
    if (stored) return JSON.parse(stored)

    // Default configuration if none found
    return {
        locationId,
        type: 'sequential',
        fallbackBehavior: 'default',
        offerSequence: [], // empty means use default order from mockOffers
        weights: {},
        scarcityLimits: {}
    }
}

export const saveRotatorConfig = (config: RotatorConfig): void => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${config.locationId}`, JSON.stringify(config))
}

export const getClickCount = (offerId: string, locationId: string): number => {
    const key = `mcom_clicks_${locationId}_${offerId}`
    return parseInt(localStorage.getItem(key) || '0', 10)
}

export const incrementClickCount = (offerId: string, locationId: string): void => {
    const key = `mcom_clicks_${locationId}_${offerId}`
    const current = getClickCount(offerId, locationId)
    localStorage.setItem(key, (current + 1).toString())
}
