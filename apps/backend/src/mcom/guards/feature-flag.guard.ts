import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PurchaseService } from '../purchase/purchase.service';
import { REQUIRE_FEATURE_KEY } from '../decorators/subscription.decorators';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly purchaseService: PurchaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.getAllAndOverride<string>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!featureKey) {
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
          message: 'Active subscription required to access this feature',
          code: 'SUBSCRIPTION_EXPIRED',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const featureFlags = membership.configuration?.featureFlags || {};
    const hasFeature = Boolean(featureFlags[featureKey]);

    if (!hasFeature) {
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: `The feature '${featureKey}' is not included in your current plan tier. Upgrade to unlock this feature.`,
        code: 'FEATURE_NOT_INCLUDED',
        featureKey,
      });
    }

    return true;
  }
}
