import { mockOffers, fallbackOffer, type Offer } from './offers'
import { getRotatorConfig, incrementClickCount, getClickCount } from './rotatorStore'

// Persistent rotation tracking is now handled via localStorage in getPointer/updatePointer helper functions
const scanHistory: Map<string, { count: number; lastScan: number }> = new Map()
const MAX_SCANS_PER_MINUTE = 50

function getPointer(locationId: string): number {
    const key = `mcom_ptr_${locationId}`
    const stored = localStorage.getItem(key)
    return stored ? Number.parseInt(stored, 10) : 0
}

function updatePointer(locationId: string, current: number, total: number): void {
    const key = `mcom_ptr_${locationId}`
    const next = (current + 1) % total
    localStorage.setItem(key, next.toString())
}

function getCurrentSeason(): string {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
}

function isOfferValid(offer: Offer): boolean {
    if (!offer.isActive) return false
    const now = new Date()
    const start = new Date(offer.startDate)
    const end = new Date(offer.endDate)
    if (now < start || now > end) return false
    if (offer.season !== 'all') {
        const currentSeason = getCurrentSeason()
        if (offer.season !== currentSeason) return false
    }
    return true
}

function isRateLimited(sessionId: string): boolean {
    const now = Date.now()
    const history = scanHistory.get(sessionId)
    if (!history) {
        scanHistory.set(sessionId, { count: 1, lastScan: now })
        return false
    }
    if (now - history.lastScan > 60000) {
        scanHistory.set(sessionId, { count: 1, lastScan: now })
        return false
    }
    history.count++
    history.lastScan = now
    return history.count > MAX_SCANS_PER_MINUTE
}

/**
 * Core Engine: Fetches the next offer based on location config and rotation logic.
 */
export function getNextOffer(locationId: string, sessionId: string = 'default'): {
    offer: Offer
    isFallback: boolean
    isRateLimited: boolean
} {
    // 1. Anti-farming
    if (isRateLimited(sessionId)) {
        return { offer: fallbackOffer, isFallback: true, isRateLimited: true }
    }

    // 2. Load Config & Valid Offers
    const config = getRotatorConfig(locationId)
    const validOffers = mockOffers.filter(isOfferValid)

    if (validOffers.length === 0) {
        return { offer: fallbackOffer, isFallback: true, isRateLimited: false }
    }

    // 3. Sort/Order based on config
    let sortedOffers: Offer[] = []

    if (config.offerSequence && config.offerSequence.length > 0) {
        // Use custom admin sequence
        sortedOffers = config.offerSequence
            .map(id => validOffers.find(o => o.id === id))
            .filter((o): o is Offer => !!o)

        // Append any valid offers NOT in the sequence to the end
        const unsorted = validOffers.filter(vo => !config.offerSequence.includes(vo.id))
        sortedOffers = [...sortedOffers, ...unsorted]
    } else {
        // Default
        sortedOffers = [...validOffers]
    }

    // Always ensure Premium (Hyperlocal) comes first regardless of sequence position
    // unless the admin explicitly wants a specific order? 
    // The user said "premium which comes first", so we enforce it.
    sortedOffers.sort((a, b) => {
        if (a.isPremium === b.isPremium) return 0
        return a.isPremium ? -1 : 1
    })

    if (sortedOffers.length === 0) return { offer: fallbackOffer, isFallback: true, isRateLimited: false }

    let selectedOffer: Offer | null = null

    // 4. Apply Rotation Logic
    switch (config.type) {
        case 'random': {
            // Weighted random selection
            const totalWeight = sortedOffers.reduce((sum, o) => sum + (config.weights[o.id] || 1), 0)
            let random = Math.random() * totalWeight
            for (const offer of sortedOffers) {
                const weight = config.weights[offer.id] || 1
                if (random < weight) {
                    selectedOffer = offer
                    break
                }
                random -= weight
            }
            break
        }

        case 'scarcity': {
            // First available in list that hasn't hit limit
            selectedOffer = sortedOffers.find(o => {
                const limit = config.scarcityLimits[o.id] || Infinity
                const clicks = getClickCount(o.id, locationId)
                return clicks < limit
            }) || null
            break
        }

        case 'split': {
            // Build the expanded sequence based on appearances/weights
            // Each offer appears N times in the sequence
            const expandedSequence: Offer[] = []
            for (const offer of sortedOffers) {
                const count = config.weights[offer.id] || 1
                for (let i = 0; i < count; i++) {
                    expandedSequence.push(offer)
                }
            }

            if (expandedSequence.length === 0) break

            const currentPointer = getPointer(locationId)
            selectedOffer = expandedSequence[currentPointer % expandedSequence.length]
            updatePointer(locationId, currentPointer, expandedSequence.length)
            break
        }

        case 'sequential':
        default: {
            // Pointer based rotation
            const currentPointer = getPointer(locationId)
            selectedOffer = sortedOffers[currentPointer % sortedOffers.length]
            updatePointer(locationId, currentPointer, sortedOffers.length)
            break
        }
    }

    // 5. Final Result & Fallback
    if (!selectedOffer) {
        return { offer: fallbackOffer, isFallback: true, isRateLimited: false }
    }

    // Tracker click for scarcity and stats
    incrementClickCount(selectedOffer.id, locationId)

    return { offer: selectedOffer, isFallback: false, isRateLimited: false }
}

export function getOfferById(offerId: string): Offer | undefined {
    return mockOffers.find((o) => o.id === offerId) || (offerId === fallbackOffer.id ? fallbackOffer : undefined)
}

export function resetRotation(locationId: string): void {
    const key = `mcom_ptr_${locationId}`
    localStorage.removeItem(key)
    // Also clear config if needed, but usually we just want to reset pointer
}
