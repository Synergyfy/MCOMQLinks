import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PurchaseController, MembershipController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { McomCentralModule } from '../central/central.module';
import { WalletModule } from '../wallet/wallet.module';
import { PlanModule } from '../plan/plan.module';
import { ActiveSubscriptionGuard } from '../guards/active-subscription.guard';
import { QuotaGuard } from '../guards/quota.guard';
import { FeatureFlagGuard } from '../guards/feature-flag.guard';

@Module({
  imports: [PrismaModule, McomCentralModule, WalletModule, PlanModule],
  controllers: [PurchaseController, MembershipController],
  providers: [
    PurchaseService,
    ActiveSubscriptionGuard,
    QuotaGuard,
    FeatureFlagGuard,
  ],
  exports: [
    PurchaseService,
    ActiveSubscriptionGuard,
    QuotaGuard,
    FeatureFlagGuard,
  ],
})
export class PurchaseModule {}
