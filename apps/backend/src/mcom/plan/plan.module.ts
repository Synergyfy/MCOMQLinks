import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicPlansController } from './public-plans.controller';
import { SystemPlansController } from './plan.controller';
import { PlanService } from './plan.service';
import { PlanExpiryService } from './plan-expiry.service';

@Module({
  imports: [PrismaModule],
  controllers: [SystemPlansController, PublicPlansController],
  providers: [PlanService, PlanExpiryService],
  exports: [PlanService, PlanExpiryService],
})
export class PlanModule {}

