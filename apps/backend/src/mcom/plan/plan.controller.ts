import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { McomSolutionApiKeyGuard } from '../mcom-solution-api-key.guard';
import { CreatePlanDto, RepriceVariantDto, UpdatePlanDto } from './plan.dto';
import { PlanService } from './plan.service';

@ApiTags('MCOM System Plans')
@Controller('api/v1/system/plans')
@UseGuards(McomSolutionApiKeyGuard)
export class SystemPlansController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  @ApiOperation({ summary: 'List all plans (active and inactive)' })
  listAll() {
    return this.planService.listPlans();
  }

  @Get('schema')
  @ApiOperation({
    summary: 'Get plan schema descriptors for dynamic Console form generation',
  })
  getSchema() {
    return this.planService.getSchema();
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get a single plan or resolve a PlanVariant synthesis for centralized pricing',
  })
  async findOne(@Param('id') id: string) {
    try {
      const { variant, price, plan } =
        await this.planService.resolveActivePrice(id);
      const level = variant.tierLevel?.name || 'STANDARD';
      const label =
        level === 'PRO_PLUS' ? 'Pro+' : level === 'PRO' ? 'Pro' : 'Standard';
      const amount = Number(price?.amount ?? 0);

      const features = Array.isArray(variant.features)
        ? variant.features
        : typeof variant.features === 'string'
          ? JSON.parse(variant.features || '[]')
          : [];

      const configuration =
        typeof variant.configuration === 'string'
          ? JSON.parse(variant.configuration || '{}')
          : variant.configuration || null;

      return {
        id: variant.id,
        planId: plan?.id,
        name: `${plan?.name} · ${label}`,
        description: plan?.description ?? null,
        monthlyPrice: amount,
        quarterlyPrice: amount,
        annualPrice: amount,
        features,
        configuration,
        isActive: variant.isActive && (plan?.isActive ?? true),
        isDefault: plan?.isDefault ?? false,
        type: level,
      };
    } catch {
      // Fallback to finding the plan tree directly
      return this.planService.findOne(id);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new plan with 3 variants atomically' })
  create(@Body() dto: CreatePlanDto) {
    return this.planService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing plan (partial)' })
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.planService.update(id, dto);
  }

  @Post('variants/:variantId/prices')
  @ApiOperation({ summary: 'Versioned repricing of a specific PlanVariant' })
  repriceVariant(
    @Param('variantId') variantId: string,
    @Body() dto: RepriceVariantDto,
  ) {
    return this.planService.repriceVariant(variantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive/soft-delete a plan' })
  remove(@Param('id') id: string) {
    return this.planService.remove(id);
  }
}
