import { SupportService } from './support.service.js';
import { AiChatService } from './ai-chat.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import {
  TicketPriority,
  TicketStatus,
  TicketCategory,
  OrderStatus,
} from '@ecommerce/contracts';

describe('Support & AI Chat Module', () => {
  let supportService: SupportService;
  let aiChatService: AiChatService;
  let mockPrisma: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      ticket: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      ticketMessage: {
        create: jest.fn(),
      },
      chatSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      chatMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      faqItem: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockEventEmitter = {
      emit: jest.fn(),
    };

    supportService = new SupportService(mockPrisma as PrismaService, mockEventEmitter as any);
    aiChatService = new AiChatService(mockPrisma as PrismaService, supportService);
  });

  describe('SupportService', () => {
    it('should create ticket with accurate SLA due target for URGENT priority', async () => {
      mockPrisma.ticket.create.mockImplementation((args: any) => ({
        id: 'tkt-1',
        ...args.data,
      }));

      const before = Date.now();
      const ticket = await supportService.createTicket('user-1', {
        category: TicketCategory.ORDER,
        priority: TicketPriority.URGENT,
        subject: 'Damaged item received',
        message: 'The package arrived ripped and broken.',
      });

      expect(mockPrisma.ticket.create).toHaveBeenCalled();
      expect(ticket.priority).toBe(TicketPriority.URGENT);

      // Verify SLA due is approximately 4 hours in the future
      const dueHours = (new Date(ticket.slaDueAt).getTime() - before) / (1000 * 60 * 60);
      expect(dueHours).toBeCloseTo(4, 0);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('ticket.created', expect.any(Object));
    });

    it('should escalate overdue tickets past SLA due date to URGENT', async () => {
      const pastDue = new Date(Date.now() - 3600 * 1000);

      mockPrisma.ticket.findMany.mockResolvedValue([
        { id: 'tkt-overdue-1', ticketNumber: 'TKT-2026-000001', slaDueAt: pastDue },
        { id: 'tkt-overdue-2', ticketNumber: 'TKT-2026-000002', slaDueAt: pastDue },
      ]);

      const result = await supportService.checkAndEscalateSlaBreaches();

      expect(result.escalatedCount).toBe(2);
      expect(mockPrisma.ticket.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['tkt-overdue-1', 'tkt-overdue-2'] } },
        data: {
          priority: TicketPriority.URGENT,
          status: TicketStatus.ESCALATED,
        },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('ticket.sla_breached', expect.any(Object));
    });
  });

  describe('AiChatService', () => {
    it('should retrieve live order tracking information for customer query', async () => {
      mockPrisma.chatSession.create.mockResolvedValue({ id: 'sess-1' });
      mockPrisma.chatMessage.create.mockImplementation((args: any) => ({
        id: 'msg-1',
        ...args.data,
        createdAt: new Date(),
      }));

      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-2026-000101',
        userId: 'user-1',
        status: OrderStatus.SHIPPED,
        totalMinor: 199900,
        shipment: {
          courierName: 'Delhivery',
          trackingNumber: 'DEL999123',
        },
      });

      const response = await aiChatService.sendMessage(
        'user-1',
        null,
        'Where is my order ORD-2026-000101?',
        'sess-1'
      );

      expect(response.message).toContain('ORD-2026-000101');
      expect(response.message).toContain('SHIPPED');
      expect(response.message).toContain('Delhivery');
      expect(response.message).toContain('DEL999123');
    });

    it('should explain return policy when asked about returns and refunds', async () => {
      mockPrisma.chatSession.create.mockResolvedValue({ id: 'sess-1' });
      mockPrisma.chatMessage.create.mockImplementation((args: any) => ({
        id: 'msg-1',
        ...args.data,
        createdAt: new Date(),
      }));

      const response = await aiChatService.sendMessage(
        'user-1',
        null,
        'How do I return an item and get a refund?',
        'sess-1'
      );

      expect(response.message).toContain('7-day');
      expect(response.message).toContain('refund');
    });

    it('should automatically escalate and create support ticket when customer asks for a human agent', async () => {
      mockPrisma.chatSession.create.mockResolvedValue({ id: 'sess-1' });
      mockPrisma.chatMessage.create.mockImplementation((args: any) => ({
        id: 'msg-1',
        ...args.data,
        createdAt: new Date(),
      }));

      mockPrisma.ticket.create.mockResolvedValue({
        id: 'tkt-escalated',
        ticketNumber: 'TKT-2026-999888',
        priority: TicketPriority.HIGH,
      });

      const response = await aiChatService.sendMessage(
        'user-1',
        null,
        'I need to talk to a human agent please',
        'sess-1'
      );

      expect(response.message).toContain('support team');
      expect(response.message).toContain('TKT-2026-999888');
      expect((response.metadata as any)?.escalated).toBe(true);
    });
  });
});
