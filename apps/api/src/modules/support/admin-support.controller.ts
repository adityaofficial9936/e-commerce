import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  Permissions,
  TicketStatus,
  TicketPriority,
  ReplyTicketDto,
  UpdateTicketDto,
} from '@ecommerce/contracts';
import { SupportService } from './support.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Admin Support Desk')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/support')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @RequirePermissions(Permissions.TICKET_READ)
  @ApiOperation({ summary: 'List customer tickets with status, priority, and assignee filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TicketStatus })
  @ApiQuery({ name: 'priority', required: false, enum: TicketPriority })
  @ApiQuery({ name: 'assigneeId', required: false, type: String })
  async getTickets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assigneeId') assigneeId?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.supportService.adminGetTickets(pageNum, limitNum, status, priority, assigneeId);
  }

  @Get('tickets/:id')
  @RequirePermissions(Permissions.TICKET_READ)
  @ApiOperation({ summary: 'Get full back-office ticket view including internal notes' })
  async getTicketById(@Param('id') ticketId: string) {
    return this.supportService.adminGetTicketById(ticketId);
  }

  @Post('tickets/:id/reply')
  @RequirePermissions(Permissions.TICKET_REPLY)
  @ApiOperation({ summary: 'Agent response or internal note' })
  async replyTicket(
    @Param('id') ticketId: string,
    @CurrentUser('id') staffId: string,
    @Body() dto: ReplyTicketDto
  ) {
    return this.supportService.adminReplyTicket(ticketId, staffId, dto);
  }

  @Patch('tickets/:id')
  @RequirePermissions(Permissions.TICKET_UPDATE)
  @ApiOperation({ summary: 'Update ticket status, priority, or reassign support agent' })
  async updateTicket(
    @Param('id') ticketId: string,
    @CurrentUser('id') staffId: string,
    @Body() dto: UpdateTicketDto
  ) {
    return this.supportService.adminUpdateTicket(ticketId, staffId, dto);
  }

  @Post('escalate-sla')
  @RequirePermissions(Permissions.TICKET_UPDATE)
  @ApiOperation({ summary: 'Sweep and auto-escalate SLA-breached tickets to URGENT' })
  async escalateSlaBreaches() {
    return this.supportService.checkAndEscalateSlaBreaches();
  }
}
