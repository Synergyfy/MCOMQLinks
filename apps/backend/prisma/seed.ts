import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth/password.util';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting to seed the database...');

    const seededPassword = await hashPassword('password123');

    // 1. Create demo users (email/password login is ADMIN-only; other roles
    // must authenticate via Central Hub Solution SSO, so only admin is seeded).
    const demoAdmin = await prisma.user.upsert({
        where: { email: 'admin@mcomlinks.com' },
        update: {},
        create: {
            email: 'admin@mcomlinks.com',
            password: seededPassword,
            name: 'Demo Admin',
            role: 'ADMIN',
        },
    });

    console.log(`Created/Updated admin user: ${demoAdmin.email}`);

    // 1b. Seed the 3 platform-wide PlanTierLevels:
    // STANDARD (90 Days), PRO (180 Days), PRO_PLUS (1 Calendar Year)
    const tierLevelsData = [
        { name: 'STANDARD', sortOrder: 1, durationDays: 90, isCalendarYear: false },
        { name: 'PRO', sortOrder: 2, durationDays: 180, isCalendarYear: false },
        { name: 'PRO_PLUS', sortOrder: 3, durationDays: null, isCalendarYear: true },
    ];

    const seededTierLevels: Record<string, any> = {};
    for (const tl of tierLevelsData) {
        const tier = await prisma.planTierLevel.upsert({
            where: { name: tl.name },
            update: { sortOrder: tl.sortOrder, durationDays: tl.durationDays, isCalendarYear: tl.isCalendarYear },
            create: { name: tl.name, sortOrder: tl.sortOrder, durationDays: tl.durationDays, isCalendarYear: tl.isCalendarYear },
        });
        seededTierLevels[tl.name] = tier;
    }
    console.log('Seeded PlanTierLevels: STANDARD (90d), PRO (180d), PRO_PLUS (1yr)');

    // 1c. Seed Plan Families with their 3 Variants and active Prices
    const seedPlans = [
        {
            name: 'Hyper-local',
            slug: 'hyper-local',
            description: 'The free base tier to get your storefront on the rotator.',
            tagline: 'Start showing your business on MCOMQLinks',
            bestFor: 'Businesses just getting started, testing the platform, local storefront presence',
            isFree: true,
            isActive: true,
            isDefault: true,
            type: 'STANDARD',
            variants: [
                {
                    tier: 'STANDARD',
                    price: 0,
                    features: ['1 Active Campaign', 'Postcode-Locked Exposure', 'Standard Support (90 Days)'],
                    limitations: ['No promotion of third-party products', 'Expires after 90 days', 'Standard visibility only'],
                    configuration: { quotas: { maxActiveCampaigns: 1, maxOffers: 5, maxLocations: 1, maxImagesPerListing: 5, featuredListingAllowance: 0 }, featureFlags: { priorityBoost: false, priorityInSearch: false, advancedAnalytics: false, customBranding: false, dedicatedSupport: false, allowThirdPartyPromotion: false, allowAutoRollover: false, allowExpoAccess: false } },
                },
                {
                    tier: 'PRO',
                    price: 0,
                    features: ['1 Active Campaign', 'Postcode-Locked Exposure', 'Standard Support (180 Days)'],
                    limitations: ['No promotion of third-party products', 'Standard visibility only'],
                    configuration: { quotas: { maxActiveCampaigns: 1, maxOffers: 5, maxLocations: 1, maxImagesPerListing: 5, featuredListingAllowance: 0 }, featureFlags: { priorityBoost: false, priorityInSearch: false, advancedAnalytics: false, customBranding: false, dedicatedSupport: false, allowThirdPartyPromotion: false, allowAutoRollover: true, allowExpoAccess: false } },
                },
                {
                    tier: 'PRO_PLUS',
                    price: 0,
                    features: ['1 Active Campaign', 'Postcode-Locked Exposure', 'Standard Support (1 Full Year)'],
                    limitations: ['No promotion of third-party products', 'Standard visibility only'],
                    configuration: { quotas: { maxActiveCampaigns: 1, maxOffers: 5, maxLocations: 1, maxImagesPerListing: 5, featuredListingAllowance: 0 }, featureFlags: { priorityBoost: false, priorityInSearch: false, advancedAnalytics: false, customBranding: false, dedicatedSupport: false, allowThirdPartyPromotion: false, allowAutoRollover: true, allowExpoAccess: false } },
                },
            ],
        },
        {
            name: 'Nearby Expansion',
            slug: 'nearby-expansion',
            description: 'B2B outreach and cross-high-street partnerships.',
            tagline: 'Grow beyond your storefront and scale your campaigns',
            bestFor: 'Businesses ready to scale, multi-product/service sellers, partner/collaboration businesses',
            isFree: false,
            isActive: true,
            isDefault: false,
            type: 'STANDARD',
            variants: [
                {
                    tier: 'STANDARD',
                    price: 29.99,
                    features: ['Expansion Radius Add-ons', 'Multiple Nearby Districts', 'B2B Partnerships', 'Growth Support (90 Days)'],
                    limitations: ['No Expo access', 'Standard priority boost'],
                    configuration: { quotas: { maxActiveCampaigns: 5, maxOffers: 20, maxLocations: 5, maxImagesPerListing: 15, featuredListingAllowance: 2, allowNearbyExpansion: true }, featureFlags: { priorityBoost: true, priorityInSearch: true, advancedAnalytics: true, customBranding: true, dedicatedSupport: false, allowThirdPartyPromotion: true, allowAutoRollover: true, allowExpoAccess: false } },
                },
                {
                    tier: 'PRO',
                    price: 54.99,
                    features: ['Expansion Radius Add-ons', 'Multiple Nearby Districts', 'B2B Partnerships', 'Growth Support (180 Days)', 'Continuous Rollover'],
                    limitations: ['No Expo access'],
                    configuration: { quotas: { maxActiveCampaigns: 8, maxOffers: 35, maxLocations: 10, maxImagesPerListing: 20, featuredListingAllowance: 4, allowNearbyExpansion: true }, featureFlags: { priorityBoost: true, priorityInSearch: true, advancedAnalytics: true, customBranding: true, dedicatedSupport: true, allowThirdPartyPromotion: true, allowAutoRollover: true, allowExpoAccess: false } },
                },
                {
                    tier: 'PRO_PLUS',
                    price: 99.99,
                    features: ['Expansion Radius Add-ons', 'Multiple Nearby Districts', 'B2B Partnerships', 'Growth Support (1 Full Year)', 'VIP Priority Support'],
                    limitations: [],
                    configuration: { quotas: { maxActiveCampaigns: 12, maxOffers: 50, maxLocations: 15, maxImagesPerListing: 30, featuredListingAllowance: 8, allowNearbyExpansion: true }, featureFlags: { priorityBoost: true, priorityInSearch: true, advancedAnalytics: true, customBranding: true, dedicatedSupport: true, allowThirdPartyPromotion: true, allowAutoRollover: true, allowExpoAccess: false } },
                },
            ],
        },
        {
            name: 'National Network',
            slug: 'national-network',
            description: 'Platform-wide fallback campaigns and corporate branding.',
            tagline: 'Maximum exposure, priority access, and event promotion',
            bestFor: 'Serious businesses, brands launching products/services, businesses that want maximum visibility',
            isFree: false,
            isActive: true,
            isDefault: false,
            type: 'STANDARD',
            variants: [
                {
                    tier: 'STANDARD',
                    price: 99.99,
                    features: ['CPM or Fixed Slot Access', 'Premium Override Rights', 'Platform-Wide Exposure', 'Platinum Concierge (90 Days)'],
                    limitations: [],
                    configuration: { quotas: { maxActiveCampaigns: 20, maxOffers: 100, maxLocations: 50, maxImagesPerListing: 50, featuredListingAllowance: 10, allowNearbyExpansion: true, allowNationalNetwork: true }, featureFlags: { priorityBoost: true, priorityInSearch: true, advancedAnalytics: true, customBranding: true, dedicatedSupport: true, allowThirdPartyPromotion: true, allowAutoRollover: true, allowExpoAccess: true } },
                },
                {
                    tier: 'PRO',
                    price: 189.99,
                    features: ['CPM or Fixed Slot Access', 'Premium Override Rights', 'Platform-Wide Exposure', 'Platinum Concierge (180 Days)', 'Expo Guaranteed Pass'],
                    limitations: [],
                    configuration: { quotas: { maxActiveCampaigns: 35, maxOffers: 200, maxLocations: 100, maxImagesPerListing: 100, featuredListingAllowance: 25, allowNearbyExpansion: true, allowNationalNetwork: true }, featureFlags: { priorityBoost: true, priorityInSearch: true, advancedAnalytics: true, customBranding: true, dedicatedSupport: true, allowThirdPartyPromotion: true, allowAutoRollover: true, allowExpoAccess: true } },
                },
                {
                    tier: 'PRO_PLUS',
                    price: 349.99,
                    features: ['CPM or Fixed Slot Access', 'Premium Override Rights', 'Platform-Wide Exposure', 'Platinum Concierge (1 Full Year)', 'Unlimited Expo Access', 'Dedicated Account Manager'],
                    limitations: [],
                    configuration: { quotas: { maxActiveCampaigns: 50, maxOffers: 500, maxLocations: 250, maxImagesPerListing: 200, featuredListingAllowance: 50, allowNearbyExpansion: true, allowNationalNetwork: true }, featureFlags: { priorityBoost: true, priorityInSearch: true, advancedAnalytics: true, customBranding: true, dedicatedSupport: true, allowThirdPartyPromotion: true, allowAutoRollover: true, allowExpoAccess: true } },
                },
            ],
        },
    ];

    for (const p of seedPlans) {
        let plan = await prisma.plan.findUnique({ where: { slug: p.slug } });
        const planData = {
            name: p.name,
            slug: p.slug,
            description: p.description,
            tagline: p.tagline,
            bestFor: p.bestFor,
            isFree: p.isFree,
            isActive: p.isActive,
            isDefault: p.isDefault,
            type: p.type,
            monthlyPrice: p.variants[0]?.price ?? 0,
            quarterlyPrice: p.variants[1]?.price ?? 0,
            annualPrice: p.variants[2]?.price ?? 0,
            features: JSON.stringify(p.variants[0]?.features ?? []),
            configuration: JSON.stringify(p.variants[0]?.configuration ?? {}),
        };

        if (plan) {
            plan = await prisma.plan.update({ where: { id: plan.id }, data: planData });
        } else {
            plan = await prisma.plan.create({ data: planData });
        }

        for (const v of p.variants) {
            const tierLevel = seededTierLevels[v.tier];
            if (!tierLevel) continue;

            let variant = await prisma.planVariant.findFirst({
                where: { planId: plan.id, tierLevelId: tierLevel.id },
            });

            const variantData = {
                planId: plan.id,
                tierLevelId: tierLevel.id,
                isActive: true,
                features: JSON.stringify(v.features),
                limitations: JSON.stringify(v.limitations || []),
                configuration: JSON.stringify(v.configuration),
            };

            if (variant) {
                variant = await prisma.planVariant.update({ where: { id: variant.id }, data: variantData });
            } else {
                variant = await prisma.planVariant.create({ data: variantData });
            }

            // Ensure active price
            const existingPrice = await prisma.planPrice.findFirst({
                where: { planVariantId: variant.id, isActive: true },
            });

            if (existingPrice) {
                if (existingPrice.amount !== v.price) {
                    await prisma.planPrice.update({
                        where: { id: existingPrice.id },
                        data: { isActive: false, effectiveTo: new Date() },
                    });
                    await prisma.planPrice.create({
                        data: {
                            planVariantId: variant.id,
                            currency: 'GBP',
                            amount: v.price,
                            isActive: true,
                            effectiveFrom: new Date(),
                        },
                    });
                }
            } else {
                await prisma.planPrice.create({
                    data: {
                        planVariantId: variant.id,
                        currency: 'GBP',
                        amount: v.price,
                        isActive: true,
                        effectiveFrom: new Date(),
                    },
                });
            }
        }
    }

    console.log(`Seeded ${seedPlans.length} plans with 3 variants each.`);

    // 2. Clear old data
    await prisma.rotatorConfig.deleteMany();
    await prisma.location.deleteMany();
    await prisma.businessProfile.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.supportMessage.deleteMany();

    // 2. Create multiple offers for rotation
    const offer1 = await prisma.offer.create({
        data: {
            businessName: "Bella's Boutique",
            headline: '☕ Buy 1 Get 1 Free on Any Latte',
            description: 'Start your morning right with our premium handcrafted lattes.',
            imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop',
            startDate: new Date(),
            endDate: new Date('2030-12-31T23:59:59Z'),
            ctaLabel: 'Save to Phone',
            ctaType: 'claim',
            leadDestination: 'https://example.com/claim',
            status: 'approved',
        },
    });

    const offer2 = await prisma.offer.create({
        data: {
            businessName: "Fashion Hub",
            headline: '👗 20% OFF Spring Collection',
            description: 'Exclusive discount for mall visitors. Valid this weekend only!',
            imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop',
            startDate: new Date(),
            endDate: new Date('2030-12-31T23:59:59Z'),
            ctaLabel: 'Get Discount',
            ctaType: 'redeem',
            redemptionCode: 'MALL20',
            status: 'approved',
        },
    });

    const offer3 = await prisma.offer.create({
        data: {
            businessName: "Tech World",
            headline: '📱 Free Screen Protector with Repairs',
            description: 'Visit us on the 2nd floor for expert gadget repairs while you wait.',
            imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&h=400&fit=crop',
            startDate: new Date(),
            endDate: new Date('2030-12-31T23:59:59Z'),
            ctaLabel: 'Visit Store',
            ctaType: 'redirect',
            leadDestination: 'https://techworld.com',
            status: 'approved',
        },
    });

    console.log(`Created 3 offers for rotation.`);

    // 3. Create a demo location and its rotator config
    const location = await prisma.location.create({
        data: {
            id: 'demo-mall',
            slug: 'demo-mall-central',
            name: 'Demo Mall Central Hub',
            campaignName: 'Full Rotation Campaign',
            address: 'Central Plaza, Shopping District',
            isActive: true,
            rotatorConfig: {
                create: {
                    type: 'sequential',
                    offerSequence: JSON.stringify([offer1.id, offer2.id, offer3.id]),
                }
            }
        }
    });
    console.log(`Created location: ${location.name} (id: ${location.id})`);

    // 4. Create some initial activities
    await prisma.activity.createMany({
        data: [
            {
                type: 'SCAN',
                description: 'Scan at Demo Mall',
                visitorId: 'User1',
                offerId: offer1.id,
                createdAt: new Date()
            }
        ]
    });

    // Bulk fake stats
    await prisma.activity.createMany({
        data: Array.from({ length: 1541 }).map(() => ({ type: 'SCAN', description: 'Anonymous Scan' })),
    });
    await prisma.activity.createMany({
        data: Array.from({ length: 522 }).map(() => ({ type: 'CLAIM', description: 'Anonymous Claim' })),
    });
    await prisma.activity.createMany({
        data: Array.from({ length: 311 }).map(() => ({ type: 'REDEMPTION', description: 'Anonymous Redemption' })),
    });

    console.log(`Created initial activity records for the dashboard.`);

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
