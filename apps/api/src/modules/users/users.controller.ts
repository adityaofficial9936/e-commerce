import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  UpdateProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
} from '@ecommerce/contracts';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current customer profile with roles and addresses' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update customer profile information' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: 'List saved shipping/billing addresses' })
  async getAddresses(@CurrentUser('id') userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Add a new address to address book' })
  async createAddress(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddressDto
  ) {
    return this.usersService.createAddress(userId, dto);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Update an existing saved address' })
  async updateAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto
  ) {
    return this.usersService.updateAddress(userId, addressId, dto);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Remove an address from address book' })
  async deleteAddress(
    @CurrentUser('id') userId: string,
    @Param('id') addressId: string
  ) {
    return this.usersService.deleteAddress(userId, addressId);
  }
}
