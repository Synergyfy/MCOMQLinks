import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
    getPlans,
    getPlanSchema,
    createPlan,
    updatePlan,
    deletePlan,
    repriceVariant,
    type PlanSchema,
    type PlanInput,
    type VariantInput,
} from '../../api/plans'
import type { Plan, PlanTierLevelName, PlanVariant } from '../../types'

interface VariantFormState {
    price: number
    features: string[]
    limitations: string[]
    quotas: Record<string, number | boolean>
    featureFlags: Record<string, boolean>
    stripePriceId: string
    paypalPlanId: string
}

interface PlanFormState {
    name: string
    slug: string
    description: string
    tagline: string
    bestFor: string
    isFree: boolean
    isActive: boolean
    isDefault: boolean
    type: 'STANDARD' | 'TRIAL' | 'SEASONAL'
    trialDuration: number | undefined
    seasonId: string | undefined
    variants: {
        STANDARD: VariantFormState
        PRO: VariantFormState
        PRO_PLUS: VariantFormState
    }
}

const emptyVariant = (schema: PlanSchema | null, defaultPrice = 0): VariantFormState => {
    const quotas: Record<string, number | boolean> = {}
    const featureFlags: Record<string, boolean> = {}
    schema?.quotas.forEach(q => { quotas[q.key] = q.type === 'boolean' ? false : 0 })
    schema?.featureFlags.forEach(f => { featureFlags[f.key] = false })
    return {
        price: defaultPrice,
        features: [],
        limitations: [],
        quotas,
        featureFlags,
        stripePriceId: '',
        paypalPlanId: '',
    }
}

const slugify = (text: string) =>
    text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const emptyForm = (schema: PlanSchema | null): PlanFormState => ({
    name: '',
    slug: '',
    description: '',
    tagline: '',
    bestFor: '',
    isFree: false,
    isActive: true,
    isDefault: false,
    type: 'STANDARD',
    trialDuration: undefined,
    seasonId: undefined,
    variants: {
        STANDARD: emptyVariant(schema, 0),
        PRO: emptyVariant(schema, 0),
        PRO_PLUS: emptyVariant(schema, 0),
    },
})

const toForm = (plan: Plan, schema: PlanSchema | null): PlanFormState => {
    const base = emptyForm(schema)
    const variantsState = { ...base.variants }

    const findVariant = (tier: PlanTierLevelName): PlanVariant | undefined =>
        plan.variants?.find(v => v.tier === tier || v.tierLevel?.name === tier)

    ;(['STANDARD', 'PRO', 'PRO_PLUS'] as PlanTierLevelName[]).forEach(tier => {
        const v = findVariant(tier)
        const vState = emptyVariant(schema, v ? v.price : tier === 'PRO' ? plan.quarterlyPrice : tier === 'PRO_PLUS' ? plan.annualPrice : plan.monthlyPrice)
        if (v) {
            vState.features = v.features || []
            vState.limitations = v.limitations || []
            schema?.quotas.forEach(q => {
                if (v.configuration?.quotas?.[q.key] !== undefined) vState.quotas[q.key] = v.configuration.quotas[q.key]
            })
            schema?.featureFlags.forEach(f => {
                if (v.configuration?.featureFlags?.[f.key] !== undefined) vState.featureFlags[f.key] = v.configuration.featureFlags[f.key]
            })
            vState.stripePriceId = v.activePrice?.stripePriceId || ''
            vState.paypalPlanId = v.activePrice?.paypalPlanId || ''
        } else {
            // Fallback from top-level plan fields
            vState.features = plan.features || []
            vState.limitations = plan.limitations || []
            schema?.quotas.forEach(q => {
                if (plan.configuration?.quotas?.[q.key] !== undefined) vState.quotas[q.key] = plan.configuration.quotas[q.key]
            })
            schema?.featureFlags.forEach(f => {
                if (plan.configuration?.featureFlags?.[f.key] !== undefined) vState.featureFlags[f.key] = plan.configuration.featureFlags[f.key]
            })
        }
        variantsState[tier] = vState
    })

    return {
        name: plan.name,
        slug: plan.slug || slugify(plan.name),
        description: plan.description || '',
        tagline: plan.tagline || '',
        bestFor: plan.bestFor || '',
        isFree: !!plan.isFree,
        isActive: plan.isActive,
        isDefault: plan.isDefault,
        type: plan.type,
        trialDuration: plan.trialDuration,
        seasonId: plan.seasonId,
        variants: variantsState,
    }
}

const inputCls: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    border: '1px solid #e2e8f0',
    fontSize: '0.9rem',
    background: '#fff',
    color: '#0f172a',
}
const labelCls: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#64748b',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
}
const cardCls: React.CSSProperties = {
    background: '#fff',
    padding: '1.75rem',
    borderRadius: '1.5rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
}

function formatMoney(value: number): string {
    return value === 0 ? 'Free' : `£${value.toFixed(2)}`
}

export default function PlanConfig() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [schema, setSchema] = useState<PlanSchema | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState<string | null>(null)

    // Modal Wizard State
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [wizardStep, setWizardStep] = useState<1 | 2>(1)
    const [form, setForm] = useState<PlanFormState>(() => emptyForm(null))
    const [formError, setFormError] = useState<string | null>(null)
    const [activeVariantTab, setActiveVariantTab] = useState<PlanTierLevelName>('STANDARD')

    // Reprice Quick Modal
    const [repriceModalVariant, setRepriceModalVariant] = useState<{ planName: string; variant: PlanVariant } | null>(null)
    const [repriceAmount, setRepriceAmount] = useState<number>(0)
    const [repricing, setRepricing] = useState(false)

    // Delete Modal
    const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null)
    const [deleting, setDeleting] = useState(false)

    const tiers = useMemo(() => [
        { id: 'STANDARD' as const, label: 'Standard', duration: '90 Days', icon: '⚡' },
        { id: 'PRO' as const, label: 'Pro', duration: '180 Days', icon: '🚀' },
        { id: 'PRO_PLUS' as const, label: 'Pro+', duration: '1 Calendar Year', icon: '👑' },
    ], [])

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            const [plansData, schemaData] = await Promise.all([getPlans(), getPlanSchema()])
            setPlans(plansData || [])
            setSchema(schemaData)
        } catch (e: any) {
            setError(e?.message || 'Failed to load plans')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const openCreate = () => {
        setEditingId(null)
        setForm(emptyForm(schema))
        setFormError(null)
        setWizardStep(1)
        setActiveVariantTab('STANDARD')
        setShowModal(true)
    }

    const openEdit = (plan: Plan) => {
        setEditingId(plan.id)
        setForm(toForm(plan, schema))
        setFormError(null)
        setWizardStep(1)
        setActiveVariantTab('STANDARD')
        setShowModal(true)
    }

    const updateForm = (patch: Partial<PlanFormState>) => {
        setForm(prev => {
            const next = { ...prev, ...patch }
            if (patch.name && !editingId && (!prev.slug || prev.slug === slugify(prev.name))) {
                next.slug = slugify(patch.name)
            }
            return next
        })
    }

    const updateVariant = (tier: PlanTierLevelName, patch: Partial<VariantFormState>) => {
        setForm(prev => ({
            ...prev,
            variants: {
                ...prev.variants,
                [tier]: {
                    ...prev.variants[tier],
                    ...patch,
                },
            },
        }))
    }

    const handleSave = async () => {
        setFormError(null)
        if (!form.name.trim()) {
            setFormError('Plan name is required.')
            setWizardStep(1)
            return
        }
        if (!form.slug.trim()) {
            setFormError('Plan slug is required.')
            setWizardStep(1)
            return
        }
        if (form.type === 'TRIAL' && (!form.trialDuration || form.trialDuration <= 0)) {
            setFormError('TRIAL plans must have a positive trial duration (days).')
            setWizardStep(1)
            return
        }
        if (form.type === 'SEASONAL' && !form.seasonId) {
            setFormError('SEASONAL plans require a season ID.')
            setWizardStep(1)
            return
        }

        setSaving(true)
        try {
            const variantsArray: VariantInput[] = (['STANDARD', 'PRO', 'PRO_PLUS'] as PlanTierLevelName[]).map(tier => {
                const v = form.variants[tier]
                return {
                    tier,
                    price: form.isFree ? 0 : Number(v.price || 0),
                    features: v.features,
                    limitations: v.limitations,
                    configuration: {
                        quotas: v.quotas,
                        featureFlags: v.featureFlags,
                    },
                    stripePriceId: v.stripePriceId || undefined,
                    paypalPlanId: v.paypalPlanId || undefined,
                }
            })

            const input: PlanInput = {
                name: form.name.trim(),
                slug: form.slug.trim(),
                description: form.description.trim() || undefined,
                tagline: form.tagline.trim() || undefined,
                bestFor: form.bestFor.trim() || undefined,
                isFree: form.isFree,
                isActive: form.isActive,
                isDefault: form.isDefault,
                type: form.type,
                trialDuration: form.type === 'TRIAL' ? form.trialDuration : undefined,
                seasonId: form.type === 'SEASONAL' ? form.seasonId : undefined,
                variants: variantsArray,
            }

            if (editingId) {
                await updatePlan(editingId, input)
            } else {
                await createPlan(input)
            }

            setShowModal(false)
            setSaved(`Plan "${form.name}" saved with Standard, Pro, and Pro+ variants.`)
            setTimeout(() => setSaved(null), 4000)
            await load()
        } catch (e: any) {
            setFormError(e?.message || 'Failed to save plan.')
        } finally {
            setSaving(false)
        }
    }

    const handleRepriceSubmit = async () => {
        if (!repriceModalVariant) return
        setRepricing(true)
        try {
            await repriceVariant(repriceModalVariant.variant.id, {
                amount: Number(repriceAmount),
                currency: 'GBP',
            })
            setSaved(`Repriced ${repriceModalVariant.planName} (${repriceModalVariant.variant.tier}) to £${Number(repriceAmount).toFixed(2)}. Old price archived.`)
            setTimeout(() => setSaved(null), 4000)
            setRepriceModalVariant(null)
            await load()
        } catch (e: any) {
            setError(e?.message || 'Failed to reprice variant.')
        } finally {
            setRepricing(false)
        }
    }

    const handleDelete = async () => {
        if (!confirmDelete) return
        setDeleting(true)
        try {
            await deletePlan(confirmDelete.id)
            setSaved(`Plan "${confirmDelete.name}" archived.`)
            setTimeout(() => setSaved(null), 3000)
            setConfirmDelete(null)
            await load()
        } catch (e: any) {
            setError(e?.message || 'Failed to archive plan.')
            setConfirmDelete(null)
        } finally {
            setDeleting(false)
        }
    }

    // Feature bullet helpers for active variant
    const currentVariant = form.variants[activeVariantTab]
    const addFeature = () => updateVariant(activeVariantTab, { features: [...currentVariant.features, ''] })
    const updateFeature = (idx: number, val: string) => {
        const features = [...currentVariant.features]
        features[idx] = val
        updateVariant(activeVariantTab, { features })
    }
    const removeFeature = (idx: number) => {
        updateVariant(activeVariantTab, { features: currentVariant.features.filter((_, i) => i !== idx) })
    }

    return (
        <AdminLayout title="Plan Management Studio">
            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Unified Membership Plans</h2>
                            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>
                                3-Variant Architecture
                            </span>
                        </div>
                        <p style={{ color: '#64748b', margin: '0.35rem 0 0 0', fontSize: '0.9rem' }}>
                            Every plan family contains Standard (90d), Pro (180d), and Pro+ (1yr) variants with immutable versioned pricing.
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <span>+</span>
                        <span>Create Plan Family</span>
                    </button>
                </div>

                {saved && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '1rem 1.25rem', borderRadius: '1rem', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        ✓ {saved}
                    </div>
                )}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '1rem 1.25rem', borderRadius: '1rem', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading plans…</div>
                ) : plans.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', border: '2px dashed #e2e8f0', borderRadius: '1.5rem' }}>
                        No plans created yet. Click <b>+ Create Plan Family</b> to add your first plan.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.75rem' }}>
                        {plans.map(plan => {
                            const standardV = plan.variants?.find(v => v.tier === 'STANDARD')
                            const proV = plan.variants?.find(v => v.tier === 'PRO')
                            const proPlusV = plan.variants?.find(v => v.tier === 'PRO_PLUS')

                            return (
                                <div key={plan.id} style={{ ...cardCls, display: 'flex', flexDirection: 'column', gap: '1rem', border: plan.isDefault ? '2px solid #2563eb' : '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>{plan.name}</h3>
                                                {plan.isDefault && <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '100px', border: '1px solid #bfdbfe' }}>DEFAULT</span>}
                                                {plan.isFree && <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: '100px', border: '1px solid #a7f3d0' }}>FREE</span>}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                                                /{plan.slug}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: plan.isActive ? '#059669' : '#94a3b8', background: plan.isActive ? '#ecfdf5' : '#f1f5f9', padding: '0.25rem 0.6rem', borderRadius: '100px' }}>
                                            {plan.isActive ? '● Active' : '○ Archived'}
                                        </span>
                                    </div>

                                    {plan.description && <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5' }}>{plan.description}</p>}

                                    {/* 3-Variant Pricing Strip */}
                                    <div style={{ background: '#f8fafc', borderRadius: '1rem', padding: '0.85rem 1rem', border: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>⚡ Standard (90d)</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                                                {plan.isFree ? 'Free' : formatMoney(standardV?.price ?? plan.monthlyPrice)}
                                            </div>
                                            {standardV && !plan.isFree && (
                                                <button
                                                    onClick={() => { setRepriceModalVariant({ planName: plan.name, variant: standardV }); setRepriceAmount(standardV.price); }}
                                                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.2rem', padding: 0 }}
                                                >
                                                    Reprice
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>🚀 Pro (180d)</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                                                {plan.isFree ? 'Free' : formatMoney(proV?.price ?? plan.quarterlyPrice)}
                                            </div>
                                            {proV && !plan.isFree && (
                                                <button
                                                    onClick={() => { setRepriceModalVariant({ planName: plan.name, variant: proV }); setRepriceAmount(proV.price); }}
                                                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.2rem', padding: 0 }}
                                                >
                                                    Reprice
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>👑 Pro+ (1yr)</div>
                                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: '0.2rem' }}>
                                                {plan.isFree ? 'Free' : formatMoney(proPlusV?.price ?? plan.annualPrice)}
                                            </div>
                                            {proPlusV && !plan.isFree && (
                                                <button
                                                    onClick={() => { setRepriceModalVariant({ planName: plan.name, variant: proPlusV }); setRepriceAmount(proPlusV.price); }}
                                                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', marginTop: '0.2rem', padding: 0 }}
                                                >
                                                    Reprice
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                                        <button onClick={() => openEdit(plan)} style={{ flex: 1, padding: '0.65rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>
                                            Configure Plan & Variants
                                        </button>
                                        <button onClick={() => setConfirmDelete(plan)} style={{ padding: '0.65rem 1rem', background: '#fff', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem' }}>
                                            Archive
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── 2-STEP PLAN CREATION / CONFIGURATION WIZARD MODAL ── */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: '#fff', borderRadius: '1.5rem', width: '100%', maxWidth: '900px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}>
                        {/* Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
                                    {editingId ? `Configure ${form.name || 'Plan'}` : 'Create Plan (1 Plan + 3 Variants)'}
                                </h3>
                                <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                                    {wizardStep === 1 ? 'Step 1: General Plan Information' : 'Step 2: Standard (90d), Pro (180d) & Pro+ (1yr) Variant Configurations'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
                        </div>

                        {/* Step Navigation Pill Bar */}
                        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', background: '#fff' }}>
                            <button
                                onClick={() => setWizardStep(1)}
                                style={{
                                    padding: '0.45rem 1rem',
                                    borderRadius: '100px',
                                    border: wizardStep === 1 ? '1px solid #2563eb' : '1px solid #e2e8f0',
                                    background: wizardStep === 1 ? '#eff6ff' : '#fff',
                                    color: wizardStep === 1 ? '#1d4ed8' : '#64748b',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                }}
                            >
                                1. General Info
                            </button>
                            <button
                                onClick={() => setWizardStep(2)}
                                style={{
                                    padding: '0.45rem 1rem',
                                    borderRadius: '100px',
                                    border: wizardStep === 2 ? '1px solid #2563eb' : '1px solid #e2e8f0',
                                    background: wizardStep === 2 ? '#eff6ff' : '#fff',
                                    color: wizardStep === 2 ? '#1d4ed8' : '#64748b',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                }}
                            >
                                2. Variant Configurations (3 Tiers)
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
                            {formError && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                                    {formError}
                                </div>
                            )}

                            {wizardStep === 1 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                    <div>
                                        <label style={labelCls}>Plan Name *</label>
                                        <input style={inputCls} value={form.name} onChange={e => updateForm({ name: e.target.value })} placeholder="e.g. Gold Plan" />
                                    </div>
                                    <div>
                                        <label style={labelCls}>URL Slug *</label>
                                        <input style={inputCls} value={form.slug} onChange={e => updateForm({ slug: e.target.value })} placeholder="e.g. gold-plan" />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={labelCls}>Description</label>
                                        <textarea style={{ ...inputCls, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => updateForm({ description: e.target.value })} placeholder="Commercial summary shown to business owners" />
                                    </div>
                                    <div>
                                        <label style={labelCls}>Tagline</label>
                                        <input style={inputCls} value={form.tagline} onChange={e => updateForm({ tagline: e.target.value })} placeholder="e.g. Grow beyond your storefront" />
                                    </div>
                                    <div>
                                        <label style={labelCls}>Best For</label>
                                        <input style={inputCls} value={form.bestFor} onChange={e => updateForm({ bestFor: e.target.value })} placeholder="e.g. High volume businesses" />
                                    </div>
                                    <div>
                                        <label style={labelCls}>Plan Type</label>
                                        <select style={inputCls} value={form.type} onChange={e => updateForm({ type: e.target.value as any })}>
                                            <option value="STANDARD">Standard</option>
                                            <option value="TRIAL">Trial</option>
                                            <option value="SEASONAL">Seasonal</option>
                                        </select>
                                    </div>
                                    {form.type === 'TRIAL' && (
                                        <div>
                                            <label style={labelCls}>Trial Duration (Days)</label>
                                            <input style={inputCls} type="number" min={1} value={form.trialDuration ?? ''} onChange={e => updateForm({ trialDuration: e.target.value ? Number(e.target.value) : undefined })} />
                                        </div>
                                    )}
                                    {form.type === 'SEASONAL' && (
                                        <div>
                                            <label style={labelCls}>Season UUID</label>
                                            <input style={inputCls} value={form.seasonId || ''} onChange={e => updateForm({ seasonId: e.target.value })} placeholder="Season rule ID" />
                                        </div>
                                    )}
                                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1.5rem', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.isActive} onChange={e => updateForm({ isActive: e.target.checked })} />
                                            Active (Visible on Platform)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.isDefault} onChange={e => updateForm({ isDefault: e.target.checked })} />
                                            Default (Fallback Plan)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={form.isFree} onChange={e => updateForm({ isFree: e.target.checked })} />
                                            Free Plan (£0 Locked)
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {/* 3-Variant Tab Switcher */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        {tiers.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setActiveVariantTab(t.id)}
                                                style={{
                                                    padding: '0.75rem',
                                                    borderRadius: '0.75rem',
                                                    border: `2px solid ${activeVariantTab === t.id ? '#2563eb' : '#e2e8f0'}`,
                                                    background: activeVariantTab === t.id ? '#eff6ff' : '#fff',
                                                    color: activeVariantTab === t.id ? '#1d4ed8' : '#64748b',
                                                    fontWeight: 800,
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                <div>{t.icon} {t.label}</div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.8 }}>{t.duration}</div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Active Variant Form */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        {/* Price & External IDs */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                                            <div>
                                                <label style={labelCls}>One-off Price (£ GBP) *</label>
                                                <input
                                                    style={inputCls}
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    disabled={form.isFree}
                                                    value={form.isFree ? 0 : currentVariant.price}
                                                    onChange={e => updateVariant(activeVariantTab, { price: Number(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div>
                                                <label style={labelCls}>Stripe Price ID</label>
                                                <input
                                                    style={inputCls}
                                                    value={currentVariant.stripePriceId}
                                                    onChange={e => updateVariant(activeVariantTab, { stripePriceId: e.target.value })}
                                                    placeholder="price_xxx"
                                                />
                                            </div>
                                            <div>
                                                <label style={labelCls}>PayPal Plan ID</label>
                                                <input
                                                    style={inputCls}
                                                    value={currentVariant.paypalPlanId}
                                                    onChange={e => updateVariant(activeVariantTab, { paypalPlanId: e.target.value })}
                                                    placeholder="P-xxx"
                                                />
                                            </div>
                                        </div>

                                        {/* Feature Bullets */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <label style={labelCls}>Marketing Feature Bullets ({activeVariantTab})</label>
                                                <button onClick={addFeature} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>+ Add Bullet</button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {currentVariant.features.map((f, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <input style={inputCls} value={f} onChange={e => updateFeature(i, e.target.value)} placeholder="e.g. Up to 20 active campaigns on high street" />
                                                        <button onClick={() => removeFeature(i)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
                                                    </div>
                                                ))}
                                                {currentVariant.features.length === 0 && <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No features added for this tier yet.</span>}
                                            </div>
                                        </div>

                                        {/* Quotas */}
                                        <div>
                                            <label style={labelCls}>Enforced Numeric Quotas ({activeVariantTab})</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                {(schema?.quotas || []).filter(q => q.type === 'number').map(q => (
                                                    <div key={q.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid #f1f5f9', borderRadius: '0.75rem' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{q.label}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>{q.key}</div>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            <input
                                                                type="number"
                                                                min={-1}
                                                                value={Number(currentVariant.quotas[q.key] ?? 0)}
                                                                onChange={e => updateVariant(activeVariantTab, { quotas: { ...currentVariant.quotas, [q.key]: Number(e.target.value) || 0 } })}
                                                                style={{ width: '80px', padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 800 }}
                                                            />
                                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{q.unlimited ? '(-1 = ∞)' : ''}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Feature Flags */}
                                        <div>
                                            <label style={labelCls}>Enforced Feature Flags ({activeVariantTab})</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                                {(schema?.featureFlags || []).map(f => (
                                                    <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid #f1f5f9', borderRadius: '0.75rem' }}>
                                                        <div>
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{f.label}</div>
                                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>{f.key}</div>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!currentVariant.featureFlags[f.key]}
                                                            onChange={e => updateVariant(activeVariantTab, { featureFlags: { ...currentVariant.featureFlags, [f.key]: e.target.checked } })}
                                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', background: '#f8fafc' }}>
                            {wizardStep === 2 ? (
                                <button onClick={() => setWizardStep(1)} style={{ padding: '0.65rem 1.25rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>
                                    ← Back to Step 1
                                </button>
                            ) : (
                                <button onClick={() => setShowModal(false)} style={{ padding: '0.65rem 1.25rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>
                                    Cancel
                                </button>
                            )}

                            {wizardStep === 1 ? (
                                <button onClick={() => setWizardStep(2)} style={{ padding: '0.65rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                                    Next: Configure Variants →
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{ padding: '0.65rem 1.75rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
                                >
                                    {saving ? 'Saving 3-Variant Plan…' : editingId ? 'Save Changes' : 'Create 3-Variant Plan'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── REPRICE VARIANT MODAL ── */}
            {repriceModalVariant && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
                    <div style={{ background: '#fff', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                            Reprice {repriceModalVariant.planName} · {repriceModalVariant.variant.tier}
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '0.5rem' }}>
                            This creates an immutable new price record. Existing active subscriptions retain their current price snapshot until renewal.
                        </p>
                        <div style={{ marginTop: '1.25rem' }}>
                            <label style={labelCls}>New Amount (£ GBP)</label>
                            <input
                                style={inputCls}
                                type="number"
                                min={0}
                                step="0.01"
                                value={repriceAmount}
                                onChange={e => setRepriceAmount(Number(e.target.value) || 0)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button onClick={() => setRepriceModalVariant(null)} style={{ padding: '0.6rem 1.25rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>
                                Cancel
                            </button>
                            <button onClick={handleRepriceSubmit} disabled={repricing} style={{ padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', opacity: repricing ? 0.6 : 1 }}>
                                {repricing ? 'Saving…' : 'Apply New Price'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ARCHIVE CONFIRM MODAL ── */}
            {confirmDelete && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)' }}>
                    <div style={{ background: '#fff', borderRadius: '1.25rem', padding: '2rem', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Archive "{confirmDelete.name}"?</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5', marginTop: '0.75rem' }}>
                            The plan family will be deactivated and hidden from purchase. Historical subscription records are preserved.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button onClick={() => setConfirmDelete(null)} style={{ padding: '0.6rem 1.25rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#475569' }}>
                                Cancel
                            </button>
                            <button onClick={handleDelete} disabled={deleting} style={{ padding: '0.6rem 1.25rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
                                {deleting ? 'Archiving…' : 'Archive Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}