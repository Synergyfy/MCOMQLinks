import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import StripeCheckoutModal from '../../components/StripeCheckoutModal'
import { getPublicPlans, getActiveMembership } from '../../api/plans'
import type { Plan, PlanTierLevelName, PlanVariant, Membership } from '../../types'

interface TierTabOption {
    id: PlanTierLevelName;
    label: string;
    icon: string;
    duration: string;
    description: string;
    badge?: string;
}

const TIER_TABS: TierTabOption[] = [
    { id: 'STANDARD', label: 'Standard', icon: '⚡', duration: '90 Days', description: '90 days access · billed once' },
    { id: 'PRO', label: 'Pro', icon: '🚀', duration: '180 Days', description: '180 days access · billed once', badge: 'Save ~20%' },
    { id: 'PRO_PLUS', label: 'Pro+', icon: '👑', duration: '1 Year', description: '1 calendar year access · billed once', badge: 'Best Value' },
];

export default function BillingPage() {
    const [searchParams] = useSearchParams()
    const [membership, setMembership] = useState<Membership | null>(null)
    const [plans, setPlans] = useState<Plan[]>([])
    const [, setLoading] = useState(true)
    const [selectedTier, setSelectedTier] = useState<PlanTierLevelName>('STANDARD')
    
    // Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null)
    const [checkoutVariant, setCheckoutVariant] = useState<PlanVariant | null>(null)

    const fetchBillingData = async () => {
        try {
            setLoading(true)
            const [membershipData, plansData] = await Promise.all([
                getActiveMembership().catch(() => null),
                getPublicPlans().catch(() => []),
            ])
            setMembership(membershipData)
            if (Array.isArray(plansData)) setPlans(plansData)
        } catch (err) {
            console.error('Failed to load billing data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBillingData()
        if (searchParams.get('first_time') === 'true') {
            setShowUpgradeModal(true)
        }
    }, [searchParams])

    const getVariantForTier = (p: Plan, tier: PlanTierLevelName): PlanVariant | undefined => {
        return (p.variants || []).find(v => (v.tierLevel?.name || v.tier) === tier)
    }

    const getVariantPrice = (p: Plan, variant?: PlanVariant): number => {
        if (p.isFree) return 0
        if (variant?.activePrice?.amount != null) return variant.activePrice.amount
        if (variant?.price != null) return variant.price
        if (selectedTier === 'STANDARD') return p.quarterlyPrice || p.monthlyPrice * 3
        if (selectedTier === 'PRO') return (p.quarterlyPrice || p.monthlyPrice * 3) * 1.8
        return p.annualPrice || (p.monthlyPrice * 10)
    }

    const handleSelectPlan = (p: Plan) => {
        const variant = getVariantForTier(p, selectedTier)
        setCheckoutPlan(p)
        setCheckoutVariant(variant || null)
        setShowUpgradeModal(false)
        setShowPaymentModal(true)
    }

    const handlePaymentSuccess = (_pkg?: any) => {
        setShowPaymentModal(false)
        setCheckoutPlan(null)
        setCheckoutVariant(null)
        fetchBillingData()
        try {
            const stored = localStorage.getItem('user')
            if (stored) {
                const u = JSON.parse(stored)
                u.permissions = { ...(u.permissions || {}), canAccess_links: true }
                localStorage.setItem('user', JSON.stringify(u))
            }
        } catch {}
        window.dispatchEvent(new CustomEvent('profile-updated'))
    }

    // Days remaining calculation
    const now = new Date()
    const expiresAt = membership?.expiresAt ? new Date(membership.expiresAt) : null
    const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0
    const isExpired = expiresAt ? expiresAt < now : false
    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7

    const currentVariant = membership?.planVariant
    const currentPlan = currentVariant?.plan || (membership as any)?.plan
    const currentTierName = currentVariant?.tierLevel?.name || currentVariant?.tier || (membership as any)?.tier || 'STANDARD'
    const planTitle = (membership as any)?.displayName || (currentPlan?.name ? `${currentPlan.name} · ${currentTierName} Tier` : (membership as any)?.planName)
    const isMembershipActive = Boolean((membership?.status === 'ACTIVE' || (membership as any)?.isActive) && !isExpired)
    const currentConfig = currentVariant?.configuration || currentPlan?.configuration || (membership as any)?.configuration || { quotas: {}, featureFlags: {} }
    const quotas = currentConfig.quotas || {}
    const flags = currentConfig.featureFlags || {}

    return (
        <DashboardLayout title="Membership & Billing">
            <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>

                {/* Active Membership Banner */}
                <div style={{
                    background: isExpired
                        ? 'linear-gradient(135deg, #fef2f2 0%, #fff 100%)'
                        : isExpiringSoon
                        ? 'linear-gradient(135deg, #fffbeb 0%, #fff 100%)'
                        : 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                    borderRadius: '2rem',
                    padding: '2.5rem',
                    marginBottom: '2.5rem',
                    border: `2px solid ${
                        isExpired
                            ? '#fee2e2'
                            : isExpiringSoon
                            ? '#fef3c7'
                            : '#dbeafe'
                    }`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '2rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
                }}>
                    <div>
                        <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '0.5rem'
                        }}>
                            Active Commercial Membership
                        </div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem', color: '#0f172a' }}>
                            {membership && planTitle ? planTitle : 'No Active Membership'}
                        </h2>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            <span style={{
                                padding: '0.45rem 1rem',
                                background: isMembershipActive ? '#ecfdf5' : '#fef2f2',
                                color: isMembershipActive ? '#059669' : '#dc2626',
                                borderRadius: '100px',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                letterSpacing: '0.5px',
                                border: `1px solid ${isMembershipActive ? '#a7f3d0' : '#fecaca'}`
                            }}>
                                {isMembershipActive
                                    ? `✓ ACTIVE (${daysRemaining} DAYS LEFT)`
                                    : isExpired
                                    ? '⚠ MEMBERSHIP EXPIRED'
                                    : '○ INACTIVE'}
                            </span>
                            
                            {expiresAt && (
                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                                    Access until <strong>{expiresAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                </span>
                            )}
                            
                            <span style={{
                                fontSize: '0.75rem',
                                color: '#475569',
                                background: '#e2e8f0',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '100px',
                                fontWeight: 700
                            }}>
                                🔒 Fixed-Duration (No Auto-Charge)
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            style={{
                                padding: '1rem 2rem',
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '1.25rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: '0 10px 25px rgba(37,99,235,0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.95rem'
                            }}
                        >
                            <span>🚀</span> {membership ? 'Upgrade / Extend Duration' : 'Choose Your Plan'}
                        </button>
                    </div>
                </div>

                {/* Expiry Warning Callout */}
                {isExpired && (
                    <div style={{
                        marginBottom: '2.5rem',
                        padding: '1.5rem 2rem',
                        background: '#fef2f2',
                        borderRadius: '1.25rem',
                        border: '1px solid #fecaca',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <span style={{ fontSize: '2.2rem' }}>⚠️</span>
                        <div style={{ fontSize: '0.95rem', color: '#991b1b', lineHeight: 1.5 }}>
                            <b>Your high-street campaign rotation is paused!</b> Your previous membership period has concluded. Extend your duration tier to restore rotator visibility across storefronts.
                        </div>
                    </div>
                )}

                {/* Membership Privileges Matrix */}
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                            Your Plan Privileges & Quotas
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                            Included in current active tier
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                        <div className="db-card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Storefront Listings</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', margin: '0.4rem 0' }}>
                                {quotas.maxListings === -1 ? 'Unlimited' : (quotas.maxListings ?? 1)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Live storefront billboard slots</div>
                        </div>

                        <div className="db-card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Active Offers</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#8b5cf6', margin: '0.4rem 0' }}>
                                {quotas.maxOffers === -1 ? 'Unlimited' : (quotas.maxOffers ?? 2)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Simultaneous rotating voucher deals</div>
                        </div>

                        <div className="db-card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Promo Campaigns</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', margin: '0.4rem 0' }}>
                                {quotas.maxActiveCampaigns === -1 ? 'Unlimited' : (quotas.maxActiveCampaigns ?? 1)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Targeted high-street zones</div>
                        </div>

                        <div className="db-card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Priority Boost</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: flags.priorityBoost ? '#f59e0b' : '#94a3b8', margin: '0.4rem 0' }}>
                                {flags.priorityBoost ? '⚡ Enabled' : '🔒 Locked'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Top frequency in rotator queue</div>
                        </div>
                    </div>
                </div>

                {/* Two-Column Grid: Billing History & Payment Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '2.5rem', flexWrap: 'wrap' }}>
                    
                    {/* Invoice & Payment History */}
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>
                            Membership Payments
                        </h3>
                        <div className="db-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '1.25rem' }}>
                            <table className="db-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Date</th>
                                        <th style={{ padding: '1rem' }}>Reference</th>
                                        <th style={{ padding: '1rem' }}>Tier</th>
                                        <th style={{ padding: '1rem' }}>Amount</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {membership?.payments && membership.payments.length > 0 ? (
                                        membership.payments.map((pmt: any) => {
                                            const refId = pmt.transactionId || pmt.paymentId || pmt.id || '';
                                            return (
                                                <tr key={pmt.id || refId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                                        {pmt.createdAt ? new Date(pmt.createdAt).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                                                        {refId.length > 14 ? `${refId.substring(0, 14)}…` : refId || '—'}
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700, color: '#2563eb' }}>
                                                        {pmt.tierLevel || 'STANDARD'}
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 900 }}>
                                                        £{Number(pmt.amount || 0).toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.6rem',
                                                            background: pmt.status === 'COMPLETED' ? '#ecfdf5' : '#fef2f2',
                                                            color: pmt.status === 'COMPLETED' ? '#059669' : '#dc2626',
                                                            borderRadius: '100px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 900
                                                        }}>
                                                            {pmt.status || 'COMPLETED'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', fontSize: '0.85rem' }}>
                                                No membership payments logged yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Supported Payment Rails */}
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: '#0f172a' }}>
                            Payment Method Rails
                        </h3>
                        <div className="db-card" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                                    <div style={{ width: '45px', height: '30px', background: '#2563eb', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 900 }}>MCOM</div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Centralized Solutions Wallet</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Instant debit with 2-step hold/capture</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                                    <div style={{ width: '45px', height: '30px', background: '#0a0a0a', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 900 }}>CARD</div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Stripe Card Elements</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Visa, Mastercard, Amex, Apple Pay</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}>
                                    <div style={{ width: '45px', height: '30px', background: '#003087', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.65rem', fontWeight: 900 }}>PP</div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>PayPal Checkout</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Seamless digital wallet payment</div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowUpgradeModal(true)}
                                className="db-btn db-btn-primary"
                                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
                            >
                                Explore Plans & Tiers
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Plan Modal with Duration Selector Tabs */}
            {showUpgradeModal && (
                <div className="db-modal-overlay" onClick={() => setShowUpgradeModal(false)}>
                    <div className="db-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '980px', borderRadius: '1.75rem' }}>
                        <div className="db-modal-header" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #e2e8f0' }}>
                            <div>
                                <h2 className="db-card-title" style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                                    Select Plan & Duration Tier
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 0' }}>
                                    Choose your plan family and duration commitment to activate storefront presence.
                                </p>
                            </div>
                            <button className="db-modal-close" onClick={() => setShowUpgradeModal(false)}>✕</button>
                        </div>

                        <div className="db-modal-content" style={{ padding: '2rem' }}>
                            {/* Duration Selector Tabs */}
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '2rem',
                                justifyContent: 'center',
                                background: '#f1f5f9',
                                padding: '0.4rem',
                                borderRadius: '1.25rem'
                            }}>
                                {TIER_TABS.map(tab => {
                                    const active = selectedTier === tab.id
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setSelectedTier(tab.id)}
                                            style={{
                                                padding: '0.65rem 1.25rem',
                                                borderRadius: '0.9rem',
                                                border: 'none',
                                                fontWeight: 800,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                transition: 'all 0.2s',
                                                background: active ? '#2563eb' : 'transparent',
                                                color: active ? '#fff' : '#64748b',
                                                boxShadow: active ? '0 4px 12px rgba(37,99,235,0.25)' : 'none'
                                            }}
                                        >
                                            <span>{tab.icon}</span>
                                            <span>{tab.label}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: active ? 0.9 : 0.7 }}>({tab.duration})</span>
                                            {tab.badge && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 900,
                                                    background: active ? '#fff' : '#dbeafe',
                                                    color: active ? '#2563eb' : '#1e40af',
                                                    padding: '0.1rem 0.4rem',
                                                    borderRadius: '100px',
                                                    marginLeft: '0.2rem'
                                                }}>
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Plan Cards Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                                {plans.map(p => {
                                    const variant = getVariantForTier(p, selectedTier)
                                    const price = getVariantPrice(p, variant)
                                    const isCurrent = currentPlan?.id === p.id && currentTierName === selectedTier
                                    const features = (variant?.features && variant.features.length > 0)
                                        ? variant.features
                                        : (p.features && p.features.length > 0 ? p.features : ['Storefront listing on MCOMQLinks'])

                                    return (
                                        <div key={p.id} style={{
                                            padding: '1.75rem',
                                            borderRadius: '1.5rem',
                                            border: `2px solid ${isCurrent ? '#2563eb' : '#e2e8f0'}`,
                                            background: isCurrent ? 'rgba(37,99,235,0.03)' : '#fff',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1rem',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#2563eb' }}>{p.name}</div>
                                                {p.isDefault && (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '100px' }}>
                                                        POPULAR
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>
                                                {p.isFree ? 'Free' : `£${price.toFixed(2)}`}
                                                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
                                                    {p.isFree ? 'forever free' : TIER_TABS.find(t => t.id === selectedTier)?.description}
                                                </span>
                                            </div>

                                            <ul style={{ padding: 0, margin: '0.5rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {features.slice(0, 5).map((f, i) => (
                                                    <li key={i} style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ color: '#2563eb', fontWeight: 900 }}>✓</span> {f}
                                                    </li>
                                                ))}
                                            </ul>

                                            <button
                                                disabled={isCurrent}
                                                onClick={() => handleSelectPlan(p)}
                                                style={{
                                                    marginTop: 'auto',
                                                    padding: '0.85rem',
                                                    borderRadius: '1rem',
                                                    border: 'none',
                                                    background: isCurrent ? '#cbd5e1' : '#2563eb',
                                                    color: '#fff',
                                                    fontWeight: 900,
                                                    fontSize: '0.9rem',
                                                    cursor: isCurrent ? 'default' : 'pointer',
                                                    boxShadow: isCurrent ? 'none' : '0 4px 12px rgba(37,99,235,0.2)'
                                                }}
                                            >
                                                {isCurrent ? 'Current Active Tier' : `Select ${p.name}`}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal (Multi-Rail: Wallet, Stripe, PayPal) */}
            {showPaymentModal && checkoutPlan && (
                <StripeCheckoutModal
                    plan={checkoutPlan}
                    variant={checkoutVariant}
                    planVariantId={checkoutVariant?.id}
                    selectedTier={selectedTier}
                    price={getVariantPrice(checkoutPlan, checkoutVariant || undefined)}
                    cycleLabel={` · ${TIER_TABS.find(t => t.id === selectedTier)?.duration}`}
                    onClose={() => {
                        setShowPaymentModal(false)
                        setCheckoutPlan(null)
                        setCheckoutVariant(null)
                    }}
                    onSuccess={handlePaymentSuccess}
                />
            )}
        </DashboardLayout>
    )
}