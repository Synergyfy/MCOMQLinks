import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum PlanType {
  STANDARD = 'STANDARD',
  TRIAL = 'TRIAL',
  SEASONAL = 'SEASONAL',
}

export enum PlanTier {
  STANDARD = 'STANDARD',
  PRO = 'PRO',
  PRO_PLUS = 'PRO_PLUS',
}

export interface PlanVariantConfiguration {
  quotas: {
    maxListings?: number; // -1 for unlimited
    maxOffers?: number;
    maxLocations?: number;
    maxActiveCampaigns?: number;
    allowProductListing?: boolean;
    allowServiceListing?: boolean;
    maxProducts?: number;
    maxServices?: number;
    maxGiftCardTemplates?: number;
    maxCouponTemplates?: number;
    maxLoyaltyPrograms?: number;
    maxImagesPerListing?: number;
    featuredListingAllowance?: number;
    allowNearbyExpansion?: boolean;
    allowNationalNetwork?: boolean;
    [key: string]: any;
  };
  featureFlags: {
    priorityInSearch?: boolean;
    priorityBoost?: boolean;
    advancedAnalytics?: boolean;
    dedicatedSupport?: boolean;
    allowCustomBranding?: boolean;
    allowGroupCreation?: boolean;
    allowThirdPartyPromotion?: boolean;
    allowAutoRollover?: boolean;
    allowExpoAccess?: boolean;
    [key: string]: any;
  };
  disabledNavIds?: string[];
}

export class VariantConfigDto {
  @ApiProperty({ enum: PlanTier, example: PlanTier.STANDARD })
  @IsEnum(PlanTier)
  tier: PlanTier;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: ['1 Active Campaign', 'Standard Support'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ example: ['No Expo access'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  limitations?: string[];

  @ApiPropertyOptional({
    example: {
      quotas: { maxActiveCampaigns: 5, maxOffers: 20 },
      featureFlags: { priorityBoost: true, advancedAnalytics: true },
    },
  })
  @IsObject()
  @IsOptional()
  configuration?: PlanVariantConfiguration;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stripePriceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paypalPlanId?: string;
}

export class CreatePlanDto {
  @ApiProperty({ example: 'Gold Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'gold-plan' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'Commercial package description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Grow beyond your storefront' })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiPropertyOptional({ example: 'Businesses ready to scale' })
  @IsString()
  @IsOptional()
  bestFor?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ enum: PlanType, default: PlanType.STANDARD })
  @IsEnum(PlanType)
  @IsOptional()
  type?: PlanType;

  @ApiPropertyOptional({ description: 'In days (required if type === TRIAL)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  trialDuration?: number;

  @ApiPropertyOptional({ description: 'UUID of season if SEASONAL' })
  @IsString()
  @IsOptional()
  seasonId?: string;

  @ApiProperty({
    type: [VariantConfigDto],
    description: 'Exactly 3 variants: STANDARD, PRO, PRO_PLUS',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantConfigDto)
  variants: VariantConfigDto[];

  // Fallback / legacy price & config support
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  monthlyPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quarterlyPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  annualPrice?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  limitations?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  configuration?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stripeMonthlyPriceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stripeQuarterlyPriceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stripeAnnualPriceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paypalMonthlyPlanId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paypalQuarterlyPlanId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paypalAnnualPlanId?: string;
}

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}

export class RepriceVariantDto {
  @ApiProperty({ example: 59.99 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ default: 'GBP' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stripePriceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paypalPlanId?: string;
}
