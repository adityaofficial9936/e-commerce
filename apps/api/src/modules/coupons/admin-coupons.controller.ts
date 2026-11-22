import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateCouponDto, UpdateCouponDto, Permissions } from '@ecommerce/contracts';
import { CouponsService } from './coupons.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';

@ApiTags('Admin Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/coupons')
export class AdminCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  @RequirePermissions(Permissions.COUPON_MANAGE)
  @ApiOperation({ summary: 'List all coupons' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCoupons(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.couponsService.getCoupons(pageNum, limitNum);
  }

  @Post()
  @RequirePermissions(Permissions.COUPON_MANAGE)
  @ApiOperation({ summary: 'Create a new coupon promotion' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    return this.couponsService.createCoupon(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permissions.COUPON_MANAGE)
  @ApiOperation({ summary: 'Update an existing coupon' })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.updateCoupon(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.COUPON_MANAGE)
  @ApiOperation({ summary: 'Delete a coupon' })
  async deleteCoupon(@Param('id') id: string) {
    return this.couponsService.deleteCoupon(id);
  }
}
