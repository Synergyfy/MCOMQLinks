import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { mockOffers } from '../../mock/offers'

export default function AdminOfferManager() {
    const [offers, setOffers] = useState(mockOffers)
    const [filter, setFilter] = useState('all')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    // Form state for new offer
    const [newOffer, setNewOffer] = useState({
        businessName: '',
        headline: '',
        description: '',
        ctaType: 'claim' as any,
        ctaValue: '', // Added dynamic value field
        startDate: '',
        endDate: '',
        location: 'High Street Central',
        isPremium: false,
        season: 'all' as any
    })

    const filteredOffers = filter === 'all' ? offers : offers.filter(o => o.status === filter)

    const handleArchive = (id: string) => {
        if (confirm('Archive this offer? It will be removed from rotation but kept in analytics history.')) {
            setOffers(offers.map(o => o.id === id ? { ...o, status: 'expired' as any, isActive: false } : o))
        }
    }

    const handleDuplicate = (id: string) => {
        const original = offers.find(o => o.id === id)
        if (original) {
            const copy = { ...original, id: `offer-${Date.now()}`, headline: `Copy of ${original.headline}`, status: 'draft' as any }
            setOffers([copy, ...offers])
        }
    }

    const handleAddOffer = (e: React.FormEvent) => {
        e.preventDefault()
        const id = `offer-${Date.now()}`
        const offer: any = {
            ...newOffer,
            id,
            imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
            status: 'approved',
            isActive: true,
            performance: { scans: 0, claims: 0 }
        }
        setOffers([offer, ...offers])
        setIsAddModalOpen(false)
        setNewOffer({
            businessName: '',
            headline: '',
            description: '',
            ctaType: 'claim',
            ctaValue: '',
            startDate: '',
            endDate: '',
            location: 'High Street Central',
            isPremium: false,
            season: 'all'
        })
    }

    return (
        <AdminLayout title="Global Offer Inventory">
            <div className="db-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 className="db-card-title">All System Offers</h2>
                        <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Full visibility and override control across all merchant campaigns.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <select className="db-input" style={{ width: '160px' }} value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="all">All Statuses</option>
                            <option value="approved">Approved</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <button className="db-btn db-btn-primary" onClick={() => setIsAddModalOpen(true)}>+ Create Global Offer</button>
                    </div>
                </div>

                <div className="db-table-wrapper">
                    <table className="db-table">
                        <thead>
                            <tr>
                                <th>Merchant & Headline</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Timeline</th>
                                <th>Engagement</th>
                                <th style={{ textAlign: 'right' }}>Admin Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOffers.map(offer => (
                                <tr key={offer.id}>
                                    <td>
                                        <div style={{ fontWeight: 800 }}>{offer.businessName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{offer.headline}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>{(offer as any).location || 'High Street Central'}</div>
                                    </td>
                                    <td>
                                        <span className={`db-badge db-badge-${offer.status}`}>
                                            {offer.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{offer.startDate}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>to {offer.endDate}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{offer.performance.scans} Scans</div>
                                        <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                                            {offer.performance.scans > 0 ? ((offer.performance.claims / offer.performance.scans) * 100).toFixed(1) : 0}% Conv.
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="db-btn db-btn-ghost" style={{ padding: '0.4rem' }} title="Duplicate" onClick={() => handleDuplicate(offer.id)}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                            </button>
                                            <button className="db-btn db-btn-ghost" style={{ padding: '0.4rem', color: '#ef4444' }} title="Archive" onClick={() => handleArchive(offer.id)}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Offer Modal */}
            {isAddModalOpen && (
                <div className="db-modal-overlay">
                    <div className="db-modal">
                        <div className="db-modal-header">
                            <h3 className="db-card-title">Create Global Campaign Offer</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="db-btn-close">&times;</button>
                        </div>
                        <form onSubmit={handleAddOffer}>
                            <div className="db-modal-content">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div className="db-form-group">
                                            <label className="db-label">Business Name</label>
                                            <input type="text" className="db-input" required placeholder="e.g. Marco's Pizza" value={newOffer.businessName} onChange={e => setNewOffer({ ...newOffer, businessName: e.target.value })} />
                                        </div>
                                        <div className="db-form-group">
                                            <label className="db-label">Offer Headline</label>
                                            <input type="text" className="db-input" required placeholder="e.g. 50% Off Large Pizzas" value={newOffer.headline} onChange={e => setNewOffer({ ...newOffer, headline: e.target.value })} />
                                        </div>
                                        <div className="db-form-group">
                                            <label className="db-label">Short Description</label>
                                            <textarea className="db-input" required style={{ height: '80px', resize: 'none' }} placeholder="Max 150 characters..." value={newOffer.description} onChange={e => setNewOffer({ ...newOffer, description: e.target.value })} />
                                        </div>
                                        <div className="db-form-group">
                                            <label className="db-label">CTA Type</label>
                                            <select className="db-input" value={newOffer.ctaType} onChange={e => setNewOffer({ ...newOffer, ctaType: e.target.value as any })}>
                                                <option value="claim">Lead Claim (Email/Phone)</option>
                                                <option value="redeem">Direct Promo Code</option>
                                                <option value="redirect">External Website Visit</option>
                                            </select>
                                        </div>
                                        {newOffer.ctaType === 'redirect' && (
                                            <div className="db-form-group">
                                                <label className="db-label">Destination Link</label>
                                                <input type="url" className="db-input" required placeholder="https://..." value={newOffer.ctaValue} onChange={e => setNewOffer({ ...newOffer, ctaValue: e.target.value })} />
                                            </div>
                                        )}
                                        {newOffer.ctaType === 'redeem' && (
                                            <div className="db-form-group">
                                                <label className="db-label">Promo Code</label>
                                                <input type="text" className="db-input" required placeholder="e.g. SAVE20" value={newOffer.ctaValue} onChange={e => setNewOffer({ ...newOffer, ctaValue: e.target.value })} />
                                            </div>
                                        )}
                                        {newOffer.ctaType === 'claim' && (
                                            <div className="db-form-group">
                                                <label className="db-label">Claim Contact (Email/Phone)</label>
                                                <input type="text" className="db-input" required placeholder="e.g. offers@marco.com" value={newOffer.ctaValue} onChange={e => setNewOffer({ ...newOffer, ctaValue: e.target.value })} />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div className="db-form-group">
                                                <label className="db-label">Start Date</label>
                                                <input type="date" className="db-input" required value={newOffer.startDate} onChange={e => setNewOffer({ ...newOffer, startDate: e.target.value })} />
                                            </div>
                                            <div className="db-form-group">
                                                <label className="db-label">End Date</label>
                                                <input type="date" className="db-input" required value={newOffer.endDate} onChange={e => setNewOffer({ ...newOffer, endDate: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="db-form-group">
                                            <label className="db-label">Assigned Location</label>
                                            <select className="db-input" value={newOffer.location} onChange={e => setNewOffer({ ...newOffer, location: e.target.value })}>
                                                <option>High Street Central</option>
                                                <option>Mall North Wing</option>
                                                <option>East Plaza Square</option>
                                                <option>West End Hub</option>
                                            </select>
                                        </div>
                                        <div className="db-form-group">
                                            <label className="db-label">Seasonal Automation</label>
                                            <select className="db-input" value={newOffer.season} onChange={e => setNewOffer({ ...newOffer, season: e.target.value as any })}>
                                                <option value="all">Always Active (Default)</option>
                                                <option value="winter">Winter Campaign</option>
                                                <option value="spring">Spring Campaign</option>
                                                <option value="summer">Summer Campaign</option>
                                                <option value="autumn">Autumn Campaign</option>
                                            </select>
                                        </div>
                                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <input type="checkbox" id="premium-toggle" checked={newOffer.isPremium} onChange={e => setNewOffer({ ...newOffer, isPremium: e.target.checked })} style={{ width: '18px', height: '18px' }} />
                                            <div>
                                                <label htmlFor="premium-toggle" style={{ fontWeight: 800, fontSize: '0.85rem', display: 'block' }}>Priority Placement (Boost)</label>
                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Always shows at the top of the rotation.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="db-modal-footer">
                                <button type="button" className="db-btn db-btn-ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                <button type="submit" className="db-btn db-btn-primary">Provision Global Offer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
