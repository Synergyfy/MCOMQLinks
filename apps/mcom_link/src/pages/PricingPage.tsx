import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import '../styles/pricing.css';
import { getPublicPlans, getPublicPlanSchema } from '../api/plans';
import type { Plan, PlanTierLevelName, PlanVariant, SessionUser } from '../types';
import type { PlanSchema } from '../api/plans';
import StripeCheckoutModal from '../components/StripeCheckoutModal';

// Reusable Icons
const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.5rem' }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
);
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" height="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
);
const XIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const PLAN_COLORS = ['#22c55e', '#2563eb', '#8b5cf6', '#f59e0b'];

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

function formatPrice(value: number): string {
    return value === 0 ? '£0' : `£${value.toFixed(2)}`;
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Pricing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [rawPlans, setRawPlans] = useState<Plan[]>([]);
  const [schema, setSchema] = useState<PlanSchema | null>(null);
  const [selectedTier, setSelectedTier] = useState<PlanTierLevelName>('STANDARD');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  
  // Checkout Modal State
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutVariant, setCheckoutVariant] = useState<PlanVariant | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getPublicPlans(), getPublicPlanSchema()])
      .then(([plansData, schemaData]) => {
        if (!active) return;
        setRawPlans(plansData || []);
        setSchema(schemaData || null);
        setLoadError(null);
      })
      .catch((e: any) => {
        if (!active) return;
        setLoadError(e?.message || 'Failed to load plans');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored) as SessionUser;
        if (localStorage.getItem('access_token')) {
          setSessionUser(user);
        }
      }
    } catch {}
  }, []);

  const getVariantForTier = (p: Plan, tier: PlanTierLevelName): PlanVariant | undefined => {
      return (p.variants || []).find(v => (v.tierLevel?.name || v.tier) === tier);
  };

  const getVariantPrice = (p: Plan, variant?: PlanVariant): number => {
      if (p.isFree) return 0;
      if (variant?.activePrice?.amount != null) return variant.activePrice.amount;
      if (variant?.price != null) return variant.price;
      if (selectedTier === 'STANDARD') return p.quarterlyPrice || p.monthlyPrice * 3;
      if (selectedTier === 'PRO') return (p.quarterlyPrice || p.monthlyPrice * 3) * 1.8;
      return p.annualPrice || (p.monthlyPrice * 10);
  };

  return (
    <div className="app-container pricing-page">
      <div className="content-wrapper">
        {/* Navbar */}
        <nav className={`navbar ${isMenuOpen ? 'menu-active' : ''}`} id="navbar">
          <div className="logo" onClick={() => window.location.href = '/'}>
            MCOMQ<span>.LINKS</span>
          </div>

          <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
            {['Home', 'Platform', 'Solutions', 'Pricing', 'About'].map((tab) => (
              tab === 'Home' ? (
                <Link key={tab} to="/" className="nav-link">Home</Link>
              ) : (
                <a
                    key={tab}
                    href={tab === 'Pricing' ? '#pricing' : `/#${tab.toLowerCase()}`}
                    className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => {
                    setActiveTab(tab);
                    setIsMenuOpen(false);
                    }}
                >
                    {tab}
                </a>
              )
            ))}
            <div className="mobile-auth">
              {sessionUser ? (
                <>
                  <Link to="/dashboard" className="btn-ghost" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  <Link to="/login" className="btn-premium" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                </>
              )}
            </div>
          </div>

          <div className="desktop-auth">
            {sessionUser ? (
              <Link to="/dashboard" className="btn-premium" style={{ textDecoration: 'none' }}>
                Dashboard <ArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none' }}>Sign In</Link>
                <Link to="/login" className="btn-premium" style={{ textDecoration: 'none' }}>
                  Get Started <ArrowRight />
                </Link>
              </>
            )}
          </div>

          <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </nav>

        {/* Header */}
        <header className="pricing-header">
            <div className="badge">✦ MCOM Unified Membership & Pricing</div>
            <h1 className="main-headline">Flexible Plans for <br /><span className="gradient-text">High Street Growth</span></h1>
            <p className="hero-description" style={{ margin: '0 auto 3rem' }}>
                Simple, fixed-duration pricing to revitalize local commerce. Pick your duration tier and grow your high-street presence.
            </p>

            {/* Dynamic Duration Selector Tabs */}
            <div style={{
                display: 'inline-flex',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)',
                padding: '0.4rem',
                borderRadius: '1.25rem',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                gap: '0.4rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
                margin: '0 auto 2.5rem'
            }}>
                {TIER_TABS.map(tab => {
                    const active = selectedTier === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTier(tab.id)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '1rem',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                background: active ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                                color: active ? '#fff' : '#64748b',
                                boxShadow: active ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span style={{
                                fontSize: '0.75rem',
                                opacity: active ? 0.9 : 0.7,
                                fontWeight: 600,
                                marginLeft: '0.2rem'
                            }}>
                                ({tab.duration})
                            </span>
                            {tab.badge && (
                                <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 900,
                                    background: active ? '#fff' : '#dbeafe',
                                    color: active ? '#2563eb' : '#1e40af',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '100px',
                                    marginLeft: '0.3rem'
                                }}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </header>

        {/* Plans Grid */}
        <section id="pricing" className="plans-grid">
            {loading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading plans…</div>
            ) : loadError ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#b91c1c', fontWeight: 700 }}>
                    Unable to load plans: {loadError}
                </div>
            ) : rawPlans.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No plans available yet. Check back soon.
                </div>
            ) : (
                <>
                {rawPlans.map((plan, index) => {
                    const variant = getVariantForTier(plan, selectedTier);
                    const price = getVariantPrice(plan, variant);
                    const isPopular = plan.isDefault;
                    const planColor = PLAN_COLORS[index % PLAN_COLORS.length];
                    const activeTabInfo = TIER_TABS.find(t => t.id === selectedTier);

                    // Features & Limitations resolution
                    const features = (variant?.features && variant.features.length > 0)
                        ? variant.features
                        : (plan.features && plan.features.length > 0 ? plan.features : ['Storefront listing on MCOMQLinks']);
                    
                    const limitations = (variant?.limitations && variant.limitations.length > 0)
                        ? variant.limitations
                        : (plan.limitations || []);

                    return (
                        <div
                            key={plan.id}
                            className={`pricing-card ${isPopular ? 'popular' : ''}`}
                            style={{ '--plan-color': planColor } as any}
                        >
                            {isPopular && <div className="popular-badge">Most Popular</div>}
                            {plan.isFree && <div className="popular-badge" style={{ background: '#10b981' }}>Free</div>}
                            
                            <div className="card-header">
                                <span className="plan-name">{plan.name}</span>
                                <span className="plan-type">
                                    {activeTabInfo?.icon} {activeTabInfo?.label} Tier · {activeTabInfo?.duration}
                                </span>
                                <div className="plan-price">
                                    <span className="amount">{plan.isFree ? 'Free' : formatPrice(price)}</span>
                                    <span className="period" style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        {plan.isFree ? 'forever free' : activeTabInfo?.description}
                                    </span>
                                </div>
                                <p className="plan-tagline">{plan.tagline || plan.description || 'Turn footfall into digital conversions'}</p>
                            </div>

                            <div className="card-features">
                                <h4>What’s Included</h4>
                                <ul>
                                    {features.map((item: string, i: number) => (
                                        <li key={i}><CheckIcon /> {item}</li>
                                    ))}
                                </ul>
                            </div>

                            {limitations.length > 0 && (
                                <div className="card-limitations">
                                    <h4>Limitations</h4>
                                    <ul>
                                        {limitations.map((item: string, i: number) => (
                                            <li key={i} className="limited"><XIcon /> {item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="card-bestfor">
                                <strong>Best For:</strong> {plan.bestFor || 'Businesses wanting structured high street promo exposure'}
                            </div>

                            <div className="card-footer">
                                {sessionUser && !sessionUser.permissions?.canAccess_links ? (
                                    <button
                                        className="btn-premium full-width"
                                        onClick={() => {
                                            setCheckoutPlan(plan);
                                            setCheckoutVariant(variant || null);
                                        }}
                                    >
                                        Start {plan.name} ({activeTabInfo?.label}) <ArrowRight />
                                    </button>
                                ) : (
                                    <button
                                        className="btn-premium full-width"
                                        onClick={() => {
                                            if (sessionUser) {
                                                setCheckoutPlan(plan);
                                                setCheckoutVariant(variant || null);
                                            } else {
                                                navigate('/login');
                                            }
                                        }}
                                    >
                                        Start {plan.name} ({activeTabInfo?.label}) <ArrowRight />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                </>
            )}
        </section>

        {/* Seasonal System Section */}
        <section className="info-section">
            <div className="glass-panel">
                <div className="info-grid">
                    <div>
                        <h2 className="section-title"><span className="gradient-text">🔁 90-Day Seasonal</span> Campaign System</h2>
                        <ul className="info-list">
                            <li>All plans run on a 90-day cycle</li>
                            <li>Your business stays active only during this period</li>
                            <li><strong>BASIC:</strong> Expires after 90 days</li>
                            <li><strong>PRO & PRO+:</strong> Continues automatically with rollover benefits</li>
                        </ul>
                    </div>
                    <div className="campaign-access">
                        <h2 className="section-title">📍 Campaign Access</h2>
                        <div className="access-item">
                            <h4>National Campaigns</h4>
                            <p>Managed by 247 GBS. Appear on high street storefronts, posters, windows, and billboards.</p>
                        </div>
                        <div className="access-item">
                            <h4>Hyper Local Campaigns</h4>
                            <p>Target customers near your business. Run outside on the street and inside your store.</p>
                        </div>
                        <div className="access-item">
                            <h4>Nearby Campaigns <span className="pro-only">(Pro & Pro+ Only)</span></h4>
                            <p>Expand beyond your location and reach new customers in other areas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Recognisable Section */}
        <section className="brand-trust">
            <h2 className="main-headline" style={{ fontSize: '2.5rem', textAlign: 'center' }}>
                Recognisable. Trusted. <span className="gradient-text">Everywhere.</span>
            </h2>
            <div className="trust-grid">
                <div className="trust-card">
                    <p>Customers can instantly recognise MCOMQLinks for a safe and consistent experience.</p>
                </div>
                <div className="trust-card">
                    <p>Works day or night, connecting physical and digital experiences seamlessly.</p>
                </div>
            </div>
            <div className="quote-box">
                “You can Q anything with an MCOMQLink”
            </div>
        </section>

        {/* Membership Section */}
        <section className="membership-section">
            <div className="glass-panel orange-tint">
                <h2 className="section-title">🔗 Membership (External)</h2>
                <h3>Already an MCOM Business Member?</h3>
                <p>Platinum Pro and Platinum Pro+ members may already have access included.</p>
                <div className="important-note">
                    <strong>Important:</strong> Bronze, Silver, and Gold members must still purchase a plan above. Membership is separate from MCOMQLinks access.
                </div>
                <button className="btn-ghost" style={{ marginTop: '1.5rem' }}>View Membership Options</button>
            </div>
        </section>

        {/* Comparison Table */}
        <section className="comparison-section">
            <h2 className="main-headline" style={{ fontSize: '3rem', textAlign: 'center' }}>Feature <span className="gradient-text">Comparison</span></h2>
            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2rem' }}>
                Comparing feature allowances for the <strong>{TIER_TABS.find(t => t.id === selectedTier)?.label} ({TIER_TABS.find(t => t.id === selectedTier)?.duration})</strong> duration tier.
            </p>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading plans…</div>
            ) : rawPlans.length === 0 ? null : (
            <div className="table-responsive">
                <table className="comparison-table">
                    <thead>
                        <tr>
                            <th>Feature</th>
                            {rawPlans.map(plan => (
                                <th key={plan.id}>{plan.name.toUpperCase()}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(schema?.featureFlags || []).map(f => (
                            <tr key={f.key}>
                                <td>{f.label}</td>
                                {rawPlans.map(plan => {
                                    const variant = getVariantForTier(plan, selectedTier);
                                    const flags = variant?.configuration?.featureFlags || plan.configuration?.featureFlags || {};
                                    const hasFeature = !!flags[f.key];
                                    return (
                                        <td key={plan.id} className={hasFeature ? 'check-cell' : 'x-cell'}>
                                            {hasFeature ? <CheckIcon /> : <XIcon />}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {(schema?.quotas || []).filter(q => q.type === 'number').map(q => (
                            <tr key={q.key}>
                                <td>{q.label}</td>
                                {rawPlans.map(plan => {
                                    const variant = getVariantForTier(plan, selectedTier);
                                    const quotas = variant?.configuration?.quotas || plan.configuration?.quotas || {};
                                    const val = quotas[q.key];
                                    const display = typeof val === 'number' ? (val === -1 ? 'Unlimited' : String(val)) : '—';
                                    return <td key={plan.id} style={{ textAlign: 'center', fontWeight: 700 }}>{display}</td>;
                                })}
                            </tr>
                        ))}
                        {(!schema || (schema.featureFlags.length === 0 && schema.quotas.filter(q => q.type === 'number').length === 0)) && (
                            <tr>
                                <td colSpan={rawPlans.length + 1} style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>No comparison features configured.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            )}
        </section>

        {/* Final CTA */}
        <section className="final-cta" style={{ textAlign: 'center', padding: '6rem 0' }}>
            <h2 className="main-headline">Ready to Start Your <br /><span className="gradient-text">{TIER_TABS.find(t => t.id === selectedTier)?.duration} Campaign?</span></h2>
            <p className="hero-description" style={{ margin: '0 auto 3rem' }}>
                Get your storefront live and start attracting local high street customers today.
            </p>
            <div className="hero-ctas" style={{ justifyContent: 'center' }}>
                <button
                    className="btn-premium"
                    style={{ padding: '1.1rem 3rem', fontSize: '1.05rem', cursor: 'pointer' }}
                    onClick={() => {
                        const targetPlan = rawPlans.find(p => p.isDefault) || rawPlans[0];
                        if (targetPlan) {
                            if (sessionUser) {
                                const variant = getVariantForTier(targetPlan, selectedTier);
                                setCheckoutPlan(targetPlan);
                                setCheckoutVariant(variant || null);
                            } else {
                                navigate('/login');
                            }
                        }
                    }}
                >
                    Get Started Now <ArrowRight />
                </button>
            </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-grid">
            <div>
              <div className="logo">MCOMQ<span>.LINKS</span></div>
              <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem', maxWidth: '300px', lineHeight: '1.7', fontSize: '0.9rem' }}>
                Revitalizing local commerce with automated, sequential digital billboard technology for National, Nearby, and Hyperlocal Mcom Promo Expos.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Platform</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7' }}>
                  Active members benefit from our 'done for you' hyperlocal and sequential promo campaigns, managed by our virtual team of agents, account managers, and consultants.
                </p>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Link to="/" className="nav-link">About Us</Link>
                <a href="#" className="nav-link">Contact</a>
                <a href="#" className="nav-link">Privacy</a>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Social</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <a href="#" className="nav-link">Twitter</a>
                <a href="#" className="nav-link">LinkedIn</a>
                <a href="#" className="nav-link">GitHub</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; 2026 McomQlinks. All rights reserved. Built for the future of commerce.
          </div>
        </footer>
      </div>

      {checkoutPlan && (
        <StripeCheckoutModal
          plan={checkoutPlan}
          variant={checkoutVariant}
          planVariantId={checkoutVariant?.id}
          selectedTier={selectedTier}
          price={getVariantPrice(checkoutPlan, checkoutVariant || undefined)}
          cycleLabel={` · ${TIER_TABS.find(t => t.id === selectedTier)?.duration}`}
          onClose={() => {
            setCheckoutPlan(null);
            setCheckoutVariant(null);
          }}
          onSuccess={() => {
            try {
              const stored = localStorage.getItem('user');
              if (stored) {
                const user = JSON.parse(stored);
                user.permissions = { ...user.permissions, canAccess_links: true };
                localStorage.setItem('user', JSON.stringify(user));
              }
            } catch {}
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
};

export default PricingPage;
