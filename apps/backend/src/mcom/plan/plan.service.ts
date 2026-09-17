import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePlanDto,
  PlanTier,
  PlanType,
  RepriceVariantDto,
  UpdatePlanDto,
  VariantConfigDto,
} from './plan.dto';
import { PlanExpiryService } from './plan-expiry.service';

const PLAN_SCHEMA = {
  quotas: [
    {
      key: 'maxActiveCampaigns',
      label: 'Max Active Campaigns',
      type: 'number',
      unlimited: true,
    },
    {
      key: 'maxOffers',
      label: 'Max Offers in Rotation',
      type: 'number',
      unlimited: true,
    },
    {
      key: 'maxLocations',
      label: 'Max Network Locations',
      type: 'number',
      unlimited: true,
    },
    {
      key: 'maxImagesPerListing',
      label: 'Max Images Per Offer',
      type: 'number',
      unlimited: true,
    },
    {
      key: 'featuredListingAllowance',
      label: 'Featured Rotator Slots',
      type: 'number',
      unlimited: true,
    },
    {
      key: 'allowNearbyExpansion',
      label: 'Enable Nearby Expansion Layer',
      type: 'boolean',
    },
    {
      key: 'allowNationalNetwork',
      label: 'Enable National Network Layer',
      type: 'boolean',
    },
  ],
  featureFlags: [
    {
      key: 'priorityBoost',
      label: 'Priority Boost (Star Placement)',
      type: 'boolean',
    },
    {
      key: 'priorityInSearch',
      label: 'Priority Ranking in Search',
      type: 'boolean',
    },
    {
      key: 'advancedAnalytics',
      label: 'Advanced Analytics Dashboard',
      type: 'boolean',
    },
    { key: 'customBranding', label: 'Custom Brand Colors', type: 'boolean' },
    { key: 'dedicatedSupport', label: 'Dedicated Account Manager', type: 'boolean' },
    {
      key: 'allowThirdPartyPromotion',
      label: 'Third-Party Promotion',
      type: 'boolean',
    },
    {
      key: 'allowAutoRollover',
      label: 'Auto Rollover Into Next Season',
      type: 'boolean',
    },
    { key: 'allowExpoAccess', label: 'Expo Access', type: 'boolean' },
  ],
};

@Injectable()
export class PlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expiryService: PlanExpiryService,
  ) {}

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private parseJson<T>(value: string | null | undefined, fallback: T): T {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  private serializeVariant(v: any) {
    const activePrice = v.prices?.find((p: any) => p.isActive) || v.prices?.[0];
    return {
      id: v.id,
      planId: v.planId,
      tierLevelId: v.tierLevelId,
      tier: v.tierLevel?.name || 'STANDARD',
      tierLevel: v.tierLevel,
      isActive: v.isActive,
      features: this.parseJson(v.features, []),
      limitations: this.parseJson(v.limitations, []),
      configuration: this.parseJson(v.configuration, {
        quotas: {},
        featureFlags: {},
      }),
      price: activePrice ? Number(activePrice.amount) : 0,
      activePrice: activePrice
        ? {
            id: activePrice.id,
            amount: Number(activePrice.amount),
            currency: activePrice.currency,
            stripePriceId: activePrice.stripePriceId,
            paypalPlanId: activePrice.paypalPlanId,
            effectiveFrom: activePrice.effectiveFrom,
          }
        : null,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    };
  }

  private serializePlan(plan: any) {
    const variants = (plan.variants || []).map((v: any) =>
      this.serializeVariant(v),
    );

    // Derive top-level prices & features from variants for backward compatibility
    const standardVariant = variants.find(
      (v: any) => v.tier === PlanTier.STANDARD,
    );
    const proVariant = variants.find((v: any) => v.tier === PlanTier.PRO);
    const proPlusVariant = variants.find(
      (v: any) => v.tier === PlanTier.PRO_PLUS,
    );

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      tagline: plan.tagline || '',
      bestFor: plan.bestFor || '',
      isFree: plan.isFree,
      isActive: plan.isActive,
      isDefault: plan.isDefault,
      type: plan.type,
      trialDuration: plan.trialDuration,
      seasonId: plan.seasonId,
      monthlyPrice: standardVariant
        ? standardVariant.price
        : plan.monthlyPrice ?? 0,
      quarterlyPrice: proVariant ? proVariant.price : plan.quarterlyPrice ?? 0,
      annualPrice: proPlusVariant
        ? proPlusVariant.price
        : plan.annualPrice ?? 0,
      features: standardVariant
        ? standardVariant.features
        : this.parseJson(plan.features, []),
      limitations: standardVariant
        ? standardVariant.limitations
        : this.parseJson(plan.limitations, []),
      configuration: standardVariant
        ? standardVariant.configuration
        : this.parseJson(plan.configuration, { quotas: {}, featureFlags: {} }),
      variants,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  async ensureTierLevels() {
    const tiers = [
      { name: PlanTier.STANDARD, sortOrder: 1, durationDays: 90, isCalendarYear: false },
      { name: PlanTier.PRO, sortOrder: 2, durationDays: 180, isCalendarYear: false },
      { name: PlanTier.PRO_PLUS, sortOrder: 3, durationDays: null, isCalendarYear: true },
    ];

    for (const t of tiers) {
      await this.prisma.planTierLevel.upsert({
        where: { name: t.name },
        update: { sortOrder: t.sortOrder, durationDays: t.durationDays, isCalendarYear: t.isCalendarYear },
        create: { name: t.name, sortOrder: t.sortOrder, durationDays: t.durationDays, isCalendarYear: t.isCalendarYear },
      });
    }

    return this.prisma.planTierLevel.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  private assertExactlyThreeTiers(dto: CreatePlanDto) {
    if (!dto.variants || dto.variants.length !== 3) {
      throw new BadRequestException(
        'Every plan must have exactly 3 variants: STANDARD, PRO, and PRO_PLUS.',
      );
    }
    const tiers = dto.variants.map((v) => v.tier);
    const required = [PlanTier.STANDARD, PlanTier.PRO, PlanTier.PRO_PLUS];
    for (const req of required) {
      if (!tiers.includes(req)) {
        throw new BadRequestException(
          `Missing required variant tier: ${req}. Plan must configure STANDARD, PRO, and PRO_PLUS.`,
        );
      }
    }
  }

  async listPlans() {
    const plans = await this.prisma.plan.findMany({
      include: {
        variants: {
          include: {
            tierLevel: true,
            prices: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return plans.map((p) => this.serializePlan(p));
  }

  async listActivePlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          include: {
            tierLevel: true,
            prices: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { monthlyPrice: 'asc' }],
    });
    return plans.map((p) => this.serializePlan(p));
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        variants: {
          include: {
            tierLevel: true,
            prices: {
              where: { isActive: true },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.serializePlan(plan);
  }

  /**
   * Resolves a PlanVariant and its active price given either a variantId or a planId.
   */
  async resolveActivePrice(variantOrPlanId: string) {
    // 1. Try finding PlanVariant directly
    const variant = await this.prisma.planVariant.findUnique({
      where: { id: variantOrPlanId },
      include: {
        plan: true,
        tierLevel: true,
        prices: {
          where: { isActive: true },
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    if (variant) {
      const activePrice = variant.prices[0];
      if (!activePrice) {
        throw new NotFoundException(
          `No active price configured for variant ${variant.id}`,
        );
      }
      return { variant, price: activePrice, plan: variant.plan };
    }

    // 2. If not a variantId, try finding Plan by ID or slug and resolve its STANDARD variant
    const plan = await this.prisma.plan.findFirst({
      where: { OR: [{ id: variantOrPlanId }, { slug: variantOrPlanId }] },
      include: {
        variants: {
          include: {
            tierLevel: true,
            prices: {
              where: { isActive: true },
              orderBy: { effectiveFrom: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!plan || !plan.variants.length) {
      throw new NotFoundException(
        `Plan or variant not found for ID "${variantOrPlanId}"`,
      );
    }

    const standardVariant =
      plan.variants.find((v) => v.tierLevel?.name === PlanTier.STANDARD) ||
      plan.variants[0];
    const activePrice = standardVariant.prices[0];

    return { variant: standardVariant, price: activePrice, plan };
  }

  /**
   * Atomic Plan Creation enforcing exactly 3 variants (STANDARD, PRO, PRO_PLUS).
   */
  async create(dto: CreatePlanDto) {
    const slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.name);
    dto.slug = slug;

    // Normalize variants if user sent legacy single-price payload
    if (!dto.variants || dto.variants.length === 0) {
      dto.variants = this.generateDefaultVariantsFromLegacyDto(dto);
    }

    this.assertExactlyThreeTiers(dto);
    await this.validatePlanRules(dto);

    const existingSlug = await this.prisma.plan.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException(`Plan with slug "${slug}" already exists`);
    }

    const tierLevels = await this.ensureTierLevels();

    const result = await this.prisma.$transaction(async (tx) => {
      const standardV = dto.variants.find((v) => v.tier === PlanTier.STANDARD);
      const proV = dto.variants.find((v) => v.tier === PlanTier.PRO);
      const proPlusV = dto.variants.find((v) => v.tier === PlanTier.PRO_PLUS);

      const plan = await tx.plan.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description || null,
          tagline: dto.tagline || null,
          bestFor: dto.bestFor || null,
          isFree: dto.isFree ?? false,
          isActive: dto.isActive ?? true,
          isDefault: dto.isDefault ?? false,
          type: dto.type || PlanType.STANDARD,
          trialDuration: dto.type === PlanType.TRIAL ? dto.trialDuration : null,
          seasonId: dto.type === PlanType.SEASONAL ? dto.seasonId : null,
          monthlyPrice: dto.isFree ? 0 : standardV?.price ?? 0,
          quarterlyPrice: dto.isFree ? 0 : proV?.price ?? 0,
          annualPrice: dto.isFree ? 0 : proPlusV?.price ?? 0,
          features: JSON.stringify(standardV?.features || []),
          limitations: JSON.stringify(standardV?.limitations || []),
          configuration: JSON.stringify(standardV?.configuration || {}),
        },
      });

      for (const vDto of dto.variants) {
        const tierLevel = tierLevels.find((t) => t.name === vDto.tier);
        if (!tierLevel) {
          throw new BadRequestException(`Tier level ${vDto.tier} not found`);
        }

        const priceAmount = dto.isFree ? 0 : Number(vDto.price || 0);

        const variant = await tx.planVariant.create({
          data: {
            planId: plan.id,
            tierLevelId: tierLevel.id,
            isActive: true,
            features: JSON.stringify(vDto.features || []),
            limitations: JSON.stringify(vDto.limitations || []),
            configuration: JSON.stringify(vDto.configuration || {}),
          },
        });

        await tx.planPrice.create({
          data: {
            planVariantId: variant.id,
            amount: priceAmount,
            currency: 'GBP',
            stripePriceId: vDto.stripePriceId || null,
            paypalPlanId: vDto.paypalPlanId || null,
            isActive: true,
            effectiveFrom: new Date(),
            effectiveTo: null,
          },
        });
      }

      if (dto.isDefault) {
        await tx.plan.updateMany({
          where: { isDefault: true, id: { not: plan.id } },
          data: { isDefault: false },
        });
      }

      return plan;
    });

    return this.findOne(result.id);
  }

  /**
   * Versioned Repricing Pattern (POST /plans/variants/:variantId/prices).
   * Old price rows are deactivated and historical snapshot records remain immutable.
   */
  async repriceVariant(variantId: string, dto: RepriceVariantDto) {
    const variant = await this.prisma.planVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Plan variant not found');

    const newPrice = await this.prisma.$transaction(async (tx) => {
      // 1. Deactivate old active price
      await tx.planPrice.updateMany({
        where: { planVariantId: variantId, isActive: true },
        data: { isActive: false, effectiveTo: new Date() },
      });

      // 2. Insert new active price row
      return tx.planPrice.create({
        data: {
          planVariantId: variantId,
          amount: Number(dto.amount),
          currency: dto.currency || 'GBP',
          stripePriceId: dto.stripePriceId || null,
          paypalPlanId: dto.paypalPlanId || null,
          isActive: true,
          effectiveFrom: new Date(),
          effectiveTo: null,
        },
      });
    });

    return newPrice;
  }

  async update(id: string, dto: UpdatePlanDto) {
    const existing = await this.prisma.plan.findUnique({
      where: { id },
      include: {
        variants: {
          include: { tierLevel: true, prices: { where: { isActive: true } } },
        },
      },
    });
    if (!existing) throw new NotFoundException('Plan not found');

    await this.validatePlanRules(dto, id);

    const slug = dto.slug
      ? this.slugify(dto.slug)
      : dto.name
        ? this.slugify(dto.name)
        : existing.slug;

    if (slug !== existing.slug) {
      const conflict = await this.prisma.plan.findUnique({ where: { slug } });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Slug "${slug}" already in use`);
      }
    }

    const tierLevels = await this.ensureTierLevels();

    await this.prisma.$transaction(async (tx) => {
      await tx.plan.update({
        where: { id },
        data: {
          name: dto.name ?? existing.name,
          slug,
          description:
            dto.description !== undefined
              ? dto.description
              : existing.description,
          tagline: dto.tagline !== undefined ? dto.tagline : existing.tagline,
          bestFor: dto.bestFor !== undefined ? dto.bestFor : existing.bestFor,
          isFree: dto.isFree !== undefined ? dto.isFree : existing.isFree,
          isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
          isDefault:
            dto.isDefault !== undefined ? dto.isDefault : existing.isDefault,
          type: dto.type ?? (existing.type as PlanType),
          trialDuration:
            dto.type === PlanType.TRIAL
              ? dto.trialDuration
              : existing.trialDuration,
          seasonId:
            dto.type === PlanType.SEASONAL ? dto.seasonId : existing.seasonId,
        },
      });

      // Update variants if provided
      if (dto.variants && dto.variants.length > 0) {
        for (const vDto of dto.variants) {
          const tierLevel = tierLevels.find((t) => t.name === vDto.tier);
          if (!tierLevel) continue;

          let variant = existing.variants.find(
            (v) => v.tierLevelId === tierLevel.id,
          );

          if (!variant) {
            variant = await tx.planVariant.create({
              data: {
                planId: id,
                tierLevelId: tierLevel.id,
                isActive: true,
                features: JSON.stringify(vDto.features || []),
                limitations: JSON.stringify(vDto.limitations || []),
                configuration: JSON.stringify(vDto.configuration || {}),
              },
              include: { tierLevel: true, prices: true },
            });
          } else {
            await tx.planVariant.update({
              where: { id: variant.id },
              data: {
                features: JSON.stringify(vDto.features || []),
                limitations: JSON.stringify(vDto.limitations || []),
                configuration: JSON.stringify(vDto.configuration || {}),
              },
            });
          }

          // Handle price updates
          const activePrice = variant.prices?.find((p) => p.isActive);
          const newAmount = dto.isFree ? 0 : Number(vDto.price || 0);

          if (!activePrice) {
            await tx.planPrice.create({
              data: {
                planVariantId: variant.id,
                amount: newAmount,
                currency: 'GBP',
                stripePriceId: vDto.stripePriceId || null,
                paypalPlanId: vDto.paypalPlanId || null,
                isActive: true,
                effectiveFrom: new Date(),
              },
            });
          } else if (Number(activePrice.amount) !== newAmount) {
            await tx.planPrice.update({
              where: { id: activePrice.id },
              data: { isActive: false, effectiveTo: new Date() },
            });
            await tx.planPrice.create({
              data: {
                planVariantId: variant.id,
                amount: newAmount,
                currency: 'GBP',
                stripePriceId: vDto.stripePriceId || activePrice.stripePriceId,
                paypalPlanId: vDto.paypalPlanId || activePrice.paypalPlanId,
                isActive: true,
                effectiveFrom: new Date(),
              },
            });
          }
        }
      }

      if (dto.isDefault) {
        await tx.plan.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const existing = await this.prisma.plan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Plan not found');

    await this.prisma.plan.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  getSchema() {
    return PLAN_SCHEMA;
  }

  private generateDefaultVariantsFromLegacyDto(
    dto: CreatePlanDto,
  ): VariantConfigDto[] {
    const mPrice = Number(dto.monthlyPrice || 0);
    const qPrice = Number(dto.quarterlyPrice || mPrice * 2.7);
    const aPrice = Number(dto.annualPrice || mPrice * 10);

    return [
      {
        tier: PlanTier.STANDARD,
        price: mPrice,
        features: dto.features || [],
        limitations: dto.limitations || [],
        configuration: dto.configuration,
        stripePriceId: dto.stripeMonthlyPriceId,
        paypalPlanId: dto.paypalMonthlyPlanId,
      },
      {
        tier: PlanTier.PRO,
        price: qPrice,
        features: dto.features || [],
        limitations: dto.limitations || [],
        configuration: dto.configuration,
        stripePriceId: dto.stripeQuarterlyPriceId,
        paypalPlanId: dto.paypalQuarterlyPlanId,
      },
      {
        tier: PlanTier.PRO_PLUS,
        price: aPrice,
        features: dto.features || [],
        limitations: dto.limitations || [],
        configuration: dto.configuration,
        stripePriceId: dto.stripeAnnualPriceId,
        paypalPlanId: dto.paypalAnnualPlanId,
      },
    ];
  }

  private async validatePlanRules(
    dto: CreatePlanDto | UpdatePlanDto,
    exceptId?: string,
  ) {
    if (dto.type === PlanType.TRIAL) {
      const trialDuration = dto.trialDuration ?? 0;
      if (!trialDuration || trialDuration <= 0) {
        throw new BadRequestException(
          'TRIAL plans must specify a positive trialDuration (in days)',
        );
      }
      const otherTrial = await this.prisma.plan.findFirst({
        where: {
          type: 'TRIAL',
          isActive: true,
          ...(exceptId ? { id: { not: exceptId } } : {}),
        },
        select: { id: true, name: true },
      });
      if (otherTrial) {
        throw new ConflictException(
          `Only one active TRIAL plan is allowed ("${otherTrial.name}" already exists). Edit or deactivate it first.`,
        );
      }
    }

    if (dto.type === PlanType.SEASONAL) {
      if (!dto.seasonId) {
        throw new BadRequestException('SEASONAL plans must specify a seasonId');
      }
      const season = await this.prisma.seasonalRule.findUnique({
        where: { id: dto.seasonId },
        select: { id: true },
      });
      if (!season) {
        throw new BadRequestException(
          `Season "${dto.seasonId}" does not exist. Create it under Seasonal Campaigns first.`,
        );
      }
    }
  }
}
