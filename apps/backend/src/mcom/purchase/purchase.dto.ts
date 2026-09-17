import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  WALLET = 'wallet',
  MCOM_WALLET = 'mcom_wallet',
}

export class InitiatePurchaseDto {
  @ApiPropertyOptional({
    example: '7b093f1d-192a-4ce4-8e12-32a89345091a',
    description: 'Plan Variant ID or Plan ID',
  })
  @IsString()
  @IsOptional()
  planVariantId?: string;

  @ApiPropertyOptional({ example: '7b093f1d-192a-4ce4-8e12-32a89345091a' })
  @IsString()
  @IsOptional()
  externalPlanId?: string;

  @ApiPropertyOptional({ enum: BillingCycle, default: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.STRIPE })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  returnUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}

export class ConfirmPurchaseDto {
  @ApiPropertyOptional({ example: '7b093f1d-192a-4ce4-8e12-32a89345091a' })
  @IsString()
  @IsOptional()
  planVariantId?: string;

  @ApiPropertyOptional({ example: '7b093f1d-192a-4ce4-8e12-32a89345091a' })
  @IsString()
  @IsOptional()
  externalPlanId?: string;

  @ApiPropertyOptional({ enum: BillingCycle, default: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.STRIPE })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional({ example: 'pi_xxx_secret_yyy' })
  @IsString()
  @IsOptional()
  paymentIntentId?: string;

  @ApiPropertyOptional({ example: 'pi_xxx' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  holdId?: string;
}

export class PurchaseWalletDto {
  @ApiPropertyOptional({ example: '7b093f1d-192a-4ce4-8e12-32a89345091a' })
  @IsString()
  @IsOptional()
  planVariantId?: string;

  @ApiPropertyOptional({ example: '7b093f1d-192a-4ce4-8e12-32a89345091a' })
  @IsString()
  @IsOptional()
  externalPlanId?: string;

  @ApiPropertyOptional({ enum: BillingCycle, default: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
