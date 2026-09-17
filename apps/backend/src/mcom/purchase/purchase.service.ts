import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { McomCentralService } from '../central/central.service';
import { McomWalletService } from '../wallet/wallet.service';
import { PlanService } from '../plan/plan.service';
import { PlanExpiryService } from '../plan/plan-expiry.service';
import {
  ConfirmPurchaseDto,
  InitiatePurchaseDto,
  PurchaseWalletDto,
} from './purchase.dto';

const DEFAULT_CENTRAL_URL = 'http://localhost:3010';

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly central: McomCentralService,
    private readonly walletService: McomWalletService,
    private readonly planService: PlanService,
    private readonly expiryService: PlanExpiryService,
  ) {}

  private centralUrl(): string {
    return (process.env.MCOM_SOLUTIONS_URL || DEFAULT_CENTRAL_URL).replace(
      /\/+$/,
      '',
    );
  }

  private platformSlug(): string {
    return process.env.MCOM_PLATFORM_SLUG || 'mcom-links';
  }

  private async getUserWithCentralToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.mcomAccessToken) {
      throw new UnauthorizedException('User is not linked to MCOM SSO');
    }
    const centralToken = await this.central.getValidCentralToken(userId);
    return { user, centralToken };
  }

  // 1. Forward the payment initiation to MCOM Solutions (Merchant of Record).
  async initiate(userId: string, dto: InitiatePurchaseDto) {
    const { centralToken } = await this.getUserWithCentralToken(userId);

    const targetId = dto.planVariantId || dto.externalPlanId;
    if (!targetId) {
      throw new BadRequestException('planVariantId or externalPlanId is required');
    }

    const { variant, price, plan } =
      await this.planService.resolveActivePrice(targetId);

    const effectiveBillingCycle =
      dto.billingCycle &&
      ['monthly', 'quarterly', 'annual'].includes(dto.billingCycle)
        ? dto.billingCycle
        : variant.tierLevel?.name === 'PRO_PLUS'
        ? 'annual'
        : variant.tierLevel?.name === 'PRO'
        ? 'quarterly'
        : 'monthly';

    const webPublicUrl = process.env.WEB_PUBLIC_URL || '';
    const provider =
      dto.provider === 'mcom_wallet' ? 'wallet' : dto.provider;

    const initiatePayload: Record<string, any> = {
      platform: this.platformSlug(),
      externalPlanId: variant.id,
      billingCycle: effectiveBillingCycle,
    };
    if (dto.returnUrl || webPublicUrl) {
      initiatePayload.returnUrl =
        dto.returnUrl || `${webPublicUrl}/payment/success`;
    }
    if (dto.cancelUrl || webPublicUrl) {
      initiatePayload.cancelUrl =
        dto.cancelUrl || `${webPublicUrl}/payment/cancel`;
    }

    const res = await axios.post(
      `${this.centralUrl()}/api/v1/payment/platform/${provider}/initiate`,
      initiatePayload,
      {
        headers: {
          Authorization: `Bearer ${centralToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    return {
      ...res.data,
      planVariantId: variant.id,
      planName: `${plan?.name} · ${variant.tierLevel?.name || 'Standard'}`,
      amount: Number(price?.amount ?? 0),
    };
  }

  // 2. Confirm with Solutions, then activate Membership & update entitlements.
  async confirm(userId: string, dto: ConfirmPurchaseDto) {
    const { user, centralToken } = await this.getUserWithCentralToken(userId);

    const targetId = dto.planVariantId || dto.externalPlanId;
    if (!targetId) {
      throw new BadRequestException('planVariantId or externalPlanId is required');
    }

    const { variant, price, plan } =
      await this.planService.resolveActivePrice(targetId);

    const provider =
      dto.provider === 'mcom_wallet' ? 'wallet' : dto.provider;

    const transactionId =
      dto.transactionId ||
      dto.paymentIntentId ||
      `tx_${provider}_${Date.now()}`;

    // 1. Idempotency check: if transactionId already activated for membership, return
    const existingPayment = await this.prisma.membershipPayment.findUnique({
      where: { transactionId },
      include: { memberships: true },
    });

    if (existingPayment && existingPayment.memberships.length > 0) {
      return {
        success: true,
        alreadyProcessed: true,
        membership: existingPayment.memberships[0],
      };
    }

    const effectiveBillingCycle =
      dto.billingCycle &&
      ['monthly', 'quarterly', 'annual'].includes(dto.billingCycle)
        ? dto.billingCycle
        : variant.tierLevel?.name === 'PRO_PLUS'
        ? 'annual'
        : variant.tierLevel?.name === 'PRO'
        ? 'quarterly'
        : 'monthly';

    // 2. Confirm with Solutions Central Hub if not already verified
    let centralPackage: any = {};
    try {
      const confirmPayload: Record<string, any> = {
        platform: this.platformSlug(),
        externalPlanId: variant.id,
        billingCycle: effectiveBillingCycle,
      };
      if (dto.paymentIntentId || dto.transactionId) {
        confirmPayload.paymentIntentId =
          dto.paymentIntentId || dto.transactionId;
      }

      const res = await axios.post(
        `${this.centralUrl()}/api/v1/payment/platform/${provider}/confirm`,
        confirmPayload,
        {
          headers: {
            Authorization: `Bearer ${centralToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );
      centralPackage = res.data || {};
    } catch (err: any) {
      this.logger.warn(
        `Central confirmation returned status: ${err?.response?.status || err.message}. Proceeding with local activation if valid.`,
      );
    }

    // 3. Compute leap-safe UTC expiry date
    const tierName = variant.tierLevel?.name || 'STANDARD';
    const startDate = new Date();
    const expiresAt = centralPackage.expiresAt
      ? new Date(centralPackage.expiresAt)
      : this.expiryService.resolveExpiryForTier(tierName, startDate);

    const amount = Number(price?.amount ?? 0);

    // 4. Save Payment record
    const savedPayment = await this.prisma.membershipPayment.upsert({
      where: { transactionId },
      create: {
        userId: user.id,
        amount,
        currency: 'GBP',
        paymentMethod: provider,
        transactionId,
      },
      update: {
        amount,
        paymentMethod: provider,
      },
    });

    // 5. In-place Membership Update (1:1 user constraint)
    const membership = await this.prisma.membership.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        planVariantId: variant.id,
        priceId: price?.id || null,
        isActive: true,
        isTrial: plan?.type === 'TRIAL',
        startDate,
        expiresAt,
        endDate: expiresAt,
        paymentId: savedPayment.id,
      },
      update: {
        planVariantId: variant.id,
        priceId: price?.id || null,
        isActive: true,
        isTrial: plan?.type === 'TRIAL',
        startDate,
        expiresAt,
        endDate: expiresAt,
        paymentId: savedPayment.id,
      },
    });

    // 6. Update local BusinessProfile
    const tierLabel =
      tierName === 'PRO_PLUS' ? 'Pro+' : tierName === 'PRO' ? 'Pro' : 'Standard';
    const planDisplayName = `${plan?.name} · ${tierLabel}`;

    await this.prisma.businessProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name: user.name || 'My Business',
        description: 'Business Profile',
        contactEmail: user.email,
        activePlanId: plan?.id || null,
        plan: planDisplayName,
        subscriptionStatus: 'active',
        planExpiresAt: expiresAt,
      },
      update: {
        activePlanId: plan?.id || null,
        plan: planDisplayName,
        subscriptionStatus: 'active',
        planExpiresAt: expiresAt,
      },
    });

    // 7. Update user permissions
    let currentPerms: Record<string, any> = {};
    try {
      currentPerms = JSON.parse(user.mcomPermissions || '{}');
    } catch {}
    currentPerms.canAccess_links = true;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        autoRenew: true,
        mcomPermissions: JSON.stringify(currentPerms),
      },
    });

    return {
      success: true,
      membership,
      package: {
        packageName: planDisplayName,
        planId: plan?.id,
        planVariantId: variant.id,
        tier: tierName,
        expiresAt,
        status: 'active',
      },
    };
  }

  // 3. Purchase a plan variant directly using MCOM Centralized Wallet credits.
  async purchaseWithWallet(userId: string, dto: PurchaseWalletDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const targetId = dto.planVariantId || dto.externalPlanId;
    if (!targetId) {
      throw new BadRequestException('planVariantId or externalPlanId is required');
    }

    const { variant, price, plan } =
      await this.planService.resolveActivePrice(targetId);

    const amount = Number(price?.amount ?? 0);
    const tierName = variant.tierLevel?.name || 'STANDARD';
    const tierLabel =
      tierName === 'PRO_PLUS' ? 'Pro+' : tierName === 'PRO' ? 'Pro' : 'Standard';
    const planDisplayName = `${plan?.name} · ${tierLabel}`;

    let receipt: any = null;
    let transactionId = `tx_wallet_${Date.now()}`;

    if (amount > 0 && !plan?.isDefault) {
      receipt = await this.walletService.debitWallet(userId, amount, {
        category: 'SUBSCRIPTION',
        description: `MCOM Links — ${planDisplayName}`,
        reference: `sub_links_${variant.id}_${Date.now()}`,
        metadata: {
          platform: this.platformSlug(),
          planId: plan?.id,
          planVariantId: variant.id,
          tier: tierName,
        },
      });
      transactionId = receipt.transactionId || transactionId;
    }

    const startDate = new Date();
    const expiresAt = this.expiryService.resolveExpiryForTier(tierName, startDate);

    // Save Payment record
    const savedPayment = await this.prisma.membershipPayment.upsert({
      where: { transactionId },
      create: {
        userId: user.id,
        amount,
        currency: 'MCOM',
        paymentMethod: 'mcom_wallet',
        transactionId,
      },
      update: {
        amount,
        paymentMethod: 'mcom_wallet',
      },
    });

    // In-place Membership Update
    const membership = await this.prisma.membership.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        planVariantId: variant.id,
        priceId: price?.id || null,
        isActive: true,
        isTrial: plan?.type === 'TRIAL',
        startDate,
        expiresAt,
        endDate: expiresAt,
        paymentId: savedPayment.id,
      },
      update: {
        planVariantId: variant.id,
        priceId: price?.id || null,
        isActive: true,
        isTrial: plan?.type === 'TRIAL',
        startDate,
        expiresAt,
        endDate: expiresAt,
        paymentId: savedPayment.id,
      },
    });

    // Sync BusinessProfile
    await this.prisma.businessProfile.upsert({
      where: { userId },
      create: {
        userId,
        name: user.name || 'My Business',
        description: 'Business Profile',
        contactEmail: user.email,
        activePlanId: plan?.id || null,
        plan: planDisplayName,
        subscriptionStatus: 'active',
        planExpiresAt: expiresAt,
      },
      update: {
        activePlanId: plan?.id || null,
        plan: planDisplayName,
        subscriptionStatus: 'active',
        planExpiresAt: expiresAt,
      },
    });

    let currentPerms: Record<string, any> = {};
    try {
      currentPerms = JSON.parse(user.mcomPermissions || '{}');
    } catch {}
    currentPerms.canAccess_links = true;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        autoRenew: true,
        mcomPermissions: JSON.stringify(currentPerms),
      },
    });

    return {
      success: true,
      membership,
      package: {
        packageName: planDisplayName,
        planId: plan?.id,
        planVariantId: variant.id,
        tier: tierName,
        expiresAt,
        status: 'active',
      },
      receipt,
    };
  }

  // Returns the active membership for a user with plan & variant details
  async getActiveMembership(userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId },
      include: {
        planVariant: {
          include: {
            plan: true,
            tierLevel: true,
            prices: { where: { isActive: true } },
          },
        },
        price: true,
        payment: true,
      },
    });

    if (!membership) {
      // Check business profile fallback
      const profile = await this.prisma.businessProfile.findUnique({
        where: { userId },
      });
      if (profile && profile.subscriptionStatus === 'active') {
        return {
          id: profile.id,
          userId,
          status: 'ACTIVE',
          isActive: true,
          isTrial: false,
          startDate: new Date(),
          expiresAt: profile.planExpiresAt || new Date(Date.now() + 90 * 86400000),
          endDate: profile.planExpiresAt || new Date(Date.now() + 90 * 86400000),
          tier: 'STANDARD',
          tierLabel: 'Standard',
          planName: profile.plan || 'Active Plan',
          displayName: profile.plan || 'Active Plan',
          planVariant: null,
          payments: [],
        };
      }
      return null;
    }

    const payments = await this.prisma.membershipPayment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const variant = membership.planVariant;
    const tierName = (variant?.tierLevel?.name || 'STANDARD') as string;
    const tierLabel =
      tierName === 'PRO_PLUS' ? 'Pro+' : tierName === 'PRO' ? 'Pro' : 'Standard';

    const parseJson = (val: any, fallback: any = {}) => {
      if (!val) return fallback;
      if (typeof val === 'object') return val;
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    };

    const isCurrentlyActive =
      membership.isActive &&
      (!membership.expiresAt || new Date(membership.expiresAt) > new Date());

    const formattedVariant = variant
      ? {
          id: variant.id,
          planId: variant.planId,
          tierLevelId: variant.tierLevelId,
          tier: tierName,
          tierLevel: variant.tierLevel,
          isActive: variant.isActive,
          features: parseJson(variant.features, []),
          limitations: parseJson(variant.limitations, []),
          configuration: parseJson(variant.configuration, {
            quotas: {},
            featureFlags: {},
          }),
          plan: variant.plan,
          price: membership.price ? Number(membership.price.amount) : 0,
          activePrice: membership.price,
        }
      : null;

    return {
      id: membership.id,
      userId: membership.userId,
      status: isCurrentlyActive ? 'ACTIVE' : 'EXPIRED',
      isActive: isCurrentlyActive,
      isTrial: membership.isTrial,
      startDate: membership.startDate,
      expiresAt: membership.expiresAt,
      endDate: membership.endDate,
      tier: tierName,
      tierLabel,
      planName: variant?.plan?.name || 'Active Plan',
      displayName: `${variant?.plan?.name || 'Plan'} · ${tierLabel}`,
      planVariantId: variant?.id,
      planId: variant?.plan?.id,
      planVariant: formattedVariant,
      plan: variant?.plan,
      price: membership.price ? Number(membership.price.amount) : 0,
      currency: membership.price?.currency || 'GBP',
      features: formattedVariant?.features || [],
      configuration: formattedVariant?.configuration || {
        quotas: {},
        featureFlags: {},
      },
      payment: membership.payment,
      payments: payments.map((p) => ({
        id: p.id,
        userId: p.userId,
        amount: Number(p.amount),
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        transactionId: p.transactionId,
        tierLevel: tierName,
        status: 'COMPLETED',
        createdAt: p.createdAt,
      })),
    };
  }
}
