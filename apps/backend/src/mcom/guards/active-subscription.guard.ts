import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PurchaseService } from '../purchase/purchase.service';
import { REQUIRE_ACTIVE_SUBSCRIPTION_KEY } from '../decorators/subscription.decorators';

@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly purchaseService: PurchaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ACTIVE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If the decorator is not explicitly present and not applied to class, pass through
    if (isRequired === false) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return true; // Let authentication guard handle missing user
    }

    // Admins bypass active subscription checks
    if (user.role === 'ADMIN') {
      return true;
    }

    const membership = await this.purchaseService.getActiveMembership(user.id);

    const now = new Date();
    const isExpired =
      !membership ||
      !membership.isActive ||
      membership.status === 'EXPIRED' ||
      (membership.expiresAt && new Date(membership.expiresAt) <= now);

    if (isExpired) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message:
            'Active subscription required. Your plan has expired or is not active.',
          code: 'SUBSCRIPTION_EXPIRED',
          expiresAt: membership?.expiresAt || null,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Attach membership to request for downstream guards and controllers
    request.membership = membership;
    return true;
  }
}
