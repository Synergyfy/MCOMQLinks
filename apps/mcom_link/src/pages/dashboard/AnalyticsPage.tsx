import DashboardLayout from '../../components/DashboardLayout'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/apiClient'
import { useActiveMembership } from '../../hooks/useActiveMembership'

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const {
        flags,
    } = useActiveMembership()

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get<any>('/dashboard/analytics')
                setData(res)
            } catch (err) {
                console.error("Failed to load analytics:", err)
                setData(null)
            } finally {
                setLoading(false)
            }
        }
        fetchAnalytics()
    }, [])

    if (loading) {
        return (
            <DashboardLayout title="Performance Analytics">
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading analytics...</div>
            </DashboardLayout>
        )
    }

    if (!data) {
        return (
            <DashboardLayout title="Performance Analytics">
                <div style={{ padding: '3rem', textAlign: 'center', color: '#e11d48' }}>Failed to load analytics data.</div>
            </DashboardLayout>
        )
    }

    const { totalScans, totalClaims, conversionRate, timeline = [], topOffers = [], recentEngagement = [], hasAdvancedAnalytics } = data
    const isAdvancedUnlocked = hasAdvancedAnalytics !== undefined ? hasAdvancedAnalytics : (flags?.advancedAnalytics ?? true)

    // Helper to format date string to short day name (e.g., 'Mon')
    const getShortDay = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-US', { weekday: 'short' })
    }

    // Find max scans for scaling the chart
    const maxScans = Math.max(...timeline.map((t: any) => t.scans), 1) // Prevent division by zero

    return (
        <DashboardLayout title="Performance Analytics">
            {/* Feature Gating Callout Banner if on Standard tier */}
            {!isAdvancedUnlocked && (
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    borderRadius: '1rem',
                    padding: '1.5rem 2rem',
                    marginBottom: '1.5rem',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>🚀</span>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                                Unlock 7-Day Trend Charts & Live Engagement Hub
                            </h3>
                        </div>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.5 }}>
                            Advanced visitor intelligence, device breakdown, and real-time interest scoring are available on <strong>Pro</strong> and <strong>Pro+</strong> tiers.
                        </p>
                    </div>
                    <Link
                        to="/dashboard/billing"
                        style={{
                            background: '#2563eb',
                            color: '#ffffff',
                            padding: '0.65rem 1.25rem',
                            borderRadius: '0.6rem',
                            fontWeight: 800,
                            fontSize: '0.875rem',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.4)',
                        }}
                    >
                        Upgrade to Pro →
                    </Link>
                </div>
            )}

            {/* 0. Recent Engagement Hub */}
            <div className="db-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', background: isAdvancedUnlocked ? '#10b981' : '#94a3b8', borderRadius: '50%', boxShadow: isAdvancedUnlocked ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none' }}></span>
                        Recent Engagement Hub
                        {!isAdvancedUnlocked && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>🔒 (Pro Feature)</span>}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Live Update: Just now</span>
                </div>

                {!isAdvancedUnlocked ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔒</div>
                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>Engagement Stream Locked</h4>
                        <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.8rem' }}>Upgrade to Pro to view real-time customer scans, claim verifications, and device telemetry.</p>
                        <Link to="/dashboard/billing" style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.8rem', textDecoration: 'none' }}>
                            View Plan Options →
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {recentEngagement.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>No recent engagement.</div>
                        ) : recentEngagement.map((act: any) => (
                            <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderLeft: `3px solid ${act.interestScore === 'verified' ? '#2563eb' : '#e2e8f0'}`, background: '#fff', borderRadius: '0 0.5rem 0.5rem 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ fontSize: '1rem' }}>{act.interestScore === 'verified' ? '👤' : '👻'}</div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{act.visitorId}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                            {act.type === 'directions' ? '📍 Requested Directions' : act.type === 'claim' ? '✅ Claimed Offer' : '👀 Viewed Offer'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: act.interestScore === 'verified' ? '#2563eb' : '#475569' }}>
                                        {act.interestScore?.toUpperCase() || 'LOW'} {act.interestScore === 'verified' ? '💎' : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 1. Global Metrics Summary */}
            <div className="db-stats-grid">
                <div className="db-stat-card">
                    <div className="db-stat-label">Total Scans (All Time)</div>
                    <div className="db-stat-value">{totalScans}</div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: '#475569' }}>Across all offers</p>
                </div>
                <div className="db-stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
                    <div className="db-stat-label">Total Claims (All Time)</div>
                    <div className="db-stat-value">{totalClaims}</div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: '#475569' }}>Customers who acted</p>
                </div>
                <div className="db-stat-card">
                    <div className="db-stat-label">Avg. Conversion</div>
                    <div className="db-stat-value">{conversionRate}%</div>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: '#475569' }}>Scan-to-Claim rate</p>
                </div>
            </div>

            {/* 2. Visual Bar Chart */}
            <div className="db-card" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 className="db-card-title" style={{ margin: 0 }}>Scan History (Last 7 Days)</h2>
                    {!isAdvancedUnlocked && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>🔒 Requires Pro</span>}
                </div>
                
                {!isAdvancedUnlocked ? (
                    <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1', padding: '1rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</span>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>7-Day Breakdown Locked</div>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem', maxWidth: '380px' }}>Upgrade your subscription to visualize day-over-day scan spikes and performance trends.</p>
                        <Link to="/dashboard/billing" style={{ background: '#2563eb', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.4rem 0.9rem', borderRadius: '0.4rem', textDecoration: 'none' }}>
                            Unlock 7-Day Chart
                        </Link>
                    </div>
                ) : (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        {timeline && timeline.length > 0 ? timeline.map((d: any, i: number) => {
                            const dayName = getShortDay(d.date);
                            return (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: 0 }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8' }}>{d.scans > 0 ? d.scans : ''}</span>
                                    <div
                                        style={{
                                            width: '100%',
                                            maxWidth: '48px',
                                            height: d.scans > 0 ? `${(d.scans / maxScans) * 100}%` : '4px',
                                            background: d.scans === maxScans && d.scans > 0 ? '#2563eb' : '#e2e8f0',
                                            borderRadius: '0.4rem 0.4rem 0 0',
                                            transition: 'height 1s ease',
                                            minHeight: '4px'
                                        }}
                                    />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>{dayName}</span>
                                </div>
                            )
                        }) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data for the last 7 days.</div>
                        )}
                    </div>
                )}
            </div>

            {/* 3. Per-Offer Breakdown — Desktop Table */}
            <div className="db-card desktop-only">
                <h2 className="db-card-title" style={{ marginBottom: '1.5rem' }}>Top Offers Performance</h2>
                <div className="db-table-wrapper">
                    <table className="db-table">
                        <thead>
                            <tr>
                                <th>Offer</th>
                                <th>Scans</th>
                                <th>Claims</th>
                                <th>Engagement Rate</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topOffers.length === 0 ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No offers yet.</td></tr>
                            ) : topOffers.map((offer: any) => {
                                const rate = offer.scans > 0
                                    ? ((offer.claims / offer.scans) * 100).toFixed(1)
                                    : "0.0";
                                return (
                                    <tr key={offer.id}>
                                        <td><div style={{ fontWeight: 700 }}>{offer.headline}</div></td>
                                        <td>{offer.scans}</td>
                                        <td>{offer.claims}</td>
                                        <td><b>{rate}%</b></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '60px', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(parseFloat(rate) * 5, 100)}%`, height: '100%', background: '#2563eb' }} />
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb' }}>High</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3b. Per-Offer Breakdown — Mobile Cards */}
            <div className="mobile-only">
                <h2 className="db-card-title" style={{ marginBottom: '1rem' }}>Top Offers Performance</h2>
                {topOffers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No offers yet.</div>
                ) : topOffers.map((offer: any) => {
                    const rate = offer.scans > 0
                        ? ((offer.claims / offer.scans) * 100).toFixed(1)
                        : "0.0";
                    return (
                        <div key={offer.id} className="db-offer-card-mobile" style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem' }}>{offer.headline}</div>
                            <div className="db-offer-card-mobile-stats">
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Scans</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{offer.scans}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Claims</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{offer.claims}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Rate</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#2563eb' }}>{rate}%</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(parseFloat(rate) * 5, 100)}%`, height: '100%', background: '#2563eb', borderRadius: '4px' }} />
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', whiteSpace: 'nowrap' }}>High</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </DashboardLayout>
    )
}
