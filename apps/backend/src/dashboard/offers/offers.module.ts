import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PurchaseModule } from '../../mcom/purchase/purchase.module';

@Module({
  imports: [PrismaModule, PurchaseModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
