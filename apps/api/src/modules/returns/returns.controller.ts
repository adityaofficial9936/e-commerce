import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateReturnRequestDto } from '@ecommerce/contracts';
import { ReturnsService } from './returns.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a return request for a delivered order within 7 days' })
  async createReturn(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReturnRequestDto
  ) {
    return this.returnsService.createReturnRequest(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List customer return requests and progress' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyReturns(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.returnsService.getUserReturns(userId, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get return request details, item status, and refund progress' })
  async getReturnById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ) {
    return this.returnsService.getUserReturnById(id, userId);
  }
}
