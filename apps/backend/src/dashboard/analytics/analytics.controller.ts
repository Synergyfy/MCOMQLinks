import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDataDto } from './dto/analytics.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { ActiveSubscriptionGuard } from '../../mcom/guards/active-subscription.guard';
import { RequireActiveSubscription } from '../../mcom/decorators/subscription.decorators';

@ApiTags('Business Dashboard Analytics')
@Controller('dashboard/analytics')
@UseGuards(JwtAuthGuard, RolesGuard, ActiveSubscriptionGuard)
@Roles('BUSINESS')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @RequireActiveSubscription()
  @ApiOperation({ summary: 'Get detailed business analytics' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed analytics data',
    type: AnalyticsDataDto,
  })
  async getAnalytics(@Request() req: any): Promise<AnalyticsDataDto> {
    return this.analyticsService.getAnalytics(req.user.id);
  }
}
