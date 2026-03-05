// Mock Location Data
// Each location represents a physical storefront with a QR/NFC trigger point

export interface Location {
    id: string
    name: string
    campaignName: string
    address: string
    isActive: boolean
}

export const mockLocations: Location[] = [
    { id: 'loc-001', name: 'High Street Central', campaignName: 'Spring High Street Campaign', address: 'London, UK', isActive: true },
    { id: 'loc-002', name: 'Mall North Wing', campaignName: 'Mall Exclusives', address: 'London, UK', isActive: true },
    { id: 'loc-003', name: 'East Plaza Square', campaignName: 'Plaza Deals', address: 'Manchester, UK', isActive: false },
    { id: 'loc-004', name: 'West End Hub', campaignName: 'West End Highlights', address: 'Birmingham, UK', isActive: true },
]

export function getLocationById(id: string): Location | undefined {
    const loc = mockLocations.find((loc) => loc.id === id)
    // Dynamic fallback for newly created locations in the UI
    if (!loc) {
        return {
            id,
            name: `Hub ${id}`,
            campaignName: 'Active Campaign',
            address: 'UK',
            isActive: true
        }
    }
    return loc
}
