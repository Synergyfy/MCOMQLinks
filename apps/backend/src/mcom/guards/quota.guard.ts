import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseService } from '../purchase/purchase.service';
import { REQUIRE_QUOTA_KEY } from '../decorators/subscription.decorators';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly purchaseService: PurchaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quotaKey = this.reflector.getAllAndOverride<string>(
      REQUIRE_QUOTA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!quotaKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id || user.role === 'ADMIN') {
      return true;
    }

    const membership =
      request.membership ||
      (await this.purchaseService.getActiveMembership(user.id));

    if (!membership || !membership.isActive) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: 'Active subscription required to perform this action',
          code: 'SUBSCRIPTION_EXPIRED',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const quotas = membership.configuration?.quotas || {};
    const limit = quotas[quotaKey];

    // If quota is unlimited (-1) or not defined, permit
    if (limit === undefined || limit === null || limit === -1) {
      return true;
    }

    if (quotaKey === 'maxOffers') {
      const profile = await this.prisma.businessProfile.findUnique({
        where: { userId: user.id },
      });
      const businessName = profile?.name || user.name || 'My Business';

      const currentOffersCount = await this.prisma.offer.count({
        where: { businessName },
      });

      if (currentOffersCount >= limit) {
        throw new ForbiddenException({
          statusCode: HttpStatus.FORBIDDEN,
          message: `Offer limit reached for your plan (${currentOffersCount}/${limit}). Upgrade your plan to publish more offers.`,
          code: 'QUOTA_EXCEEDED',
          quotaKey: 'maxOffers',
          currentCount: currentOffersCount,
          limit,
        });
      }
    }

    return true;
  }
}
