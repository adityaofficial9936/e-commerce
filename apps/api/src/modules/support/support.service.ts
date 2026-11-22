import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TicketPriority,
  TicketStatus,
  CreateTicketDto,
  ReplyTicketDto,
  UpdateTicketDto,
} from '@ecommerce/contracts';
import { PrismaService } from '../../core/prisma/prisma.service.js';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Calculate SLA target due date based on priority
   */
  private calculateSlaDueAt(priority: TicketPriority): Date {
    const hoursMap: Record<TicketPriority, number> = {
      [TicketPriority.URGENT]: 4,
      [TicketPriority.HIGH]: 12,
      [TicketPriority.NORMAL]: 24,
      [TicketPriority.LOW]: 48,
    };

    const hours = hoursMap[priority] || 24;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  /**
   * Customer raises a support ticket
   */
  async createTicket(userId: string, dto: CreateTicketDto) {
    const priority = dto.priority || TicketPriority.NORMAL;
    const slaDueAt = this.calculateSlaDueAt(priority);

    const ticketNumber = `TKT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        customerId: userId,
        orderId: dto.orderId,
        category: dto.category,
        priority,
        status: TicketStatus.OPEN,
        subject: dto.subject,
        slaDueAt,
        messages: {
          create: {
            senderId: userId,
            content: dto.message,
            attachments: dto.attachments || [],
            isInternal: false,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    this.logger.log(`Created support ticket ${ticket.ticketNumber} for customer ${userId}`);

    this.eventEmitter.emit('ticket.created', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      customerId: userId,
      priority,
    });

    return ticket;
  }

  /**
   * Customer lists their support tickets
   */
  async getUserTickets(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { customerId: userId };

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            where: { isInternal: false },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  /**
   * Customer views ticket details and non-internal message history
   */
  async getUserTicketById(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket '${ticketId}' not found`);
    }

    if (ticket.customerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this ticket');
    }

    return ticket;
  }

  /**
   * Customer sends a reply to their ticket
   */
  async userReplyTicket(ticketId: string, userId: string, dto: ReplyTicketDto) {
    const ticket = await this.getUserTicketById(ticketId, userId);

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId: userId,
          content: dto.content,
          attachments: dto.attachments || [],
          isInternal: false,
        },
      });

      // Advance status back to IN_PROGRESS or OPEN if previously WAITING_ON_CUSTOMER
      if (ticket.status === TicketStatus.WAITING_ON_CUSTOMER || ticket.status === TicketStatus.RESOLVED) {
        await tx.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.IN_PROGRESS },
        });
      }

      return msg;
    });

    this.eventEmitter.emit('ticket.customer_replied', { ticketId, userId });

    return message;
  }

  // ----------------------------------------------------
  // ADMIN SUPPORT DESK
  // ----------------------------------------------------

  async adminGetTickets(
    page = 1,
    limit = 20,
    status?: TicketStatus,
    priority?: TicketPriority,
    assigneeId?: string
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          assignee: { select: { id: true, name: true, email: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, meta: { page, limit, total } };
  }

  async adminGetTicketById(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        assignee: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket '${ticketId}' not found`);
    }

    return ticket;
  }

  async adminReplyTicket(ticketId: string, staffId: string, dto: ReplyTicketDto) {
    await this.adminGetTicketById(ticketId);

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId: staffId,
          content: dto.content,
          attachments: dto.attachments || [],
          isInternal: dto.isInternal || false,
        },
      });

      // If reply is visible to customer, mark ticket WAITING_ON_CUSTOMER
      if (!dto.isInternal) {
        await tx.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.WAITING_ON_CUSTOMER },
        });
      }

      return msg;
    });

    this.logger.log(`Staff ${staffId} replied to ticket ${ticketId} (isInternal: ${dto.isInternal || false})`);

    this.eventEmitter.emit('ticket.staff_replied', {
      ticketId,
      staffId,
      isInternal: dto.isInternal || false,
    });

    return message;
  }

  async adminUpdateTicket(ticketId: string, staffId: string, dto: UpdateTicketDto) {
    await this.adminGetTicketById(ticketId);

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    this.logger.log(`Ticket ${ticketId} updated by staff ${staffId}`);

    this.eventEmitter.emit('ticket.updated', { ticketId, staffId, changes: dto });

    return updated;
  }

  /**
   * SLA Breach auto-escalator: Escalates pending overdue tickets to URGENT priority
   */
  async checkAndEscalateSlaBreaches() {
    const now = new Date();

    const overdueTickets = await this.prisma.ticket.findMany({
      where: {
        status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        slaDueAt: { lt: now },
        priority: { not: TicketPriority.URGENT },
      },
    });

    if (overdueTickets.length === 0) {
      return { escalatedCount: 0 };
    }

    const ids = overdueTickets.map((t) => t.id);

    await this.prisma.ticket.updateMany({
      where: { id: { in: ids } },
      data: {
        priority: TicketPriority.URGENT,
        status: TicketStatus.ESCALATED,
      },
    });

    this.logger.warn(`Escalated ${ids.length} SLA-breached tickets to URGENT`);

    for (const ticket of overdueTickets) {
      this.eventEmitter.emit('ticket.sla_breached', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
      });
    }

    return { escalatedCount: ids.length, ticketIds: ids };
  }
}
