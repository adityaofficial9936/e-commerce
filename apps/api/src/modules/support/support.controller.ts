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
import {
  CreateTicketDto,
  ReplyTicketDto,
  SendChatMessageDto,
} from '@ecommerce/contracts';
import { SupportService } from './support.service.js';
import { AiChatService } from './ai-chat.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Support & AI Chat')
@Controller('support')
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly aiChatService: AiChatService
  ) {}

  // ----------------------------------------------------
  // TICKETING
  // ----------------------------------------------------

  @Post('tickets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a new customer support ticket' })
  async createTicket(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketDto
  ) {
    return this.supportService.createTicket(userId, dto);
  }

  @Get('tickets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List customer past and open tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyTickets(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.supportService.getUserTickets(userId, pageNum, limitNum);
  }

  @Get('tickets/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get ticket detail and conversation history' })
  async getTicketById(
    @CurrentUser('id') userId: string,
    @Param('id') ticketId: string
  ) {
    return this.supportService.getUserTicketById(ticketId, userId);
  }

  @Post('tickets/:id/reply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Customer sends a reply message on a ticket' })
  async replyTicket(
    @CurrentUser('id') userId: string,
    @Param('id') ticketId: string,
    @Body() dto: ReplyTicketDto
  ) {
    return this.supportService.userReplyTicket(ticketId, userId, dto);
  }

  // ----------------------------------------------------
  // AI CUSTOMER SUPPORT CHAT
  // ----------------------------------------------------

  @Post('chat')
  @Public()
  @ApiOperation({ summary: 'Interactive chat query with grounded read-only AI support bot' })
  async chatMessage(
    @CurrentUser('id') userId: string | null,
    @Body() dto: SendChatMessageDto
  ) {
    return this.aiChatService.sendMessage(
      userId,
      dto.guestToken || null,
      dto.message,
      dto.sessionId
    );
  }

  @Get('chat/:sessionId')
  @Public()
  @ApiOperation({ summary: 'Retrieve conversation history for an active AI chat session' })
  async getSessionHistory(@Param('sessionId') sessionId: string) {
    return this.aiChatService.getSessionMessages(sessionId);
  }
}
