import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { SupportService } from './support.service.js';
import { TicketCategory, TicketPriority } from '@ecommerce/contracts';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supportService: SupportService
  ) {}

  /**
   * Process customer chat query with intelligent domain retrieval
   */
  async sendMessage(
    userId: string | null,
    guestToken: string | null,
    userMessage: string,
    sessionId?: string
  ) {
    // 1. Get or create chat session
    let session: any;

    if (sessionId) {
      session = await this.prisma.chatSession.findUnique({
        where: { id: sessionId },
      });
    }

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: {
          userId: userId || undefined,
          guestToken: guestToken || undefined,
        },
      });
    }

    // 2. Persist user message
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'user',
        content: userMessage,
      },
    });

    // 3. Generate grounded assistant response
    const assistantReply = await this.generateAssistantReply(userId, userMessage);

    // 4. Persist assistant message
    const botMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'assistant',
        content: assistantReply.text,
        metadata: assistantReply.metadata || {},
      },
    });

    return {
      sessionId: session.id,
      message: botMessage.content,
      sender: botMessage.sender,
      createdAt: botMessage.createdAt,
      metadata: botMessage.metadata,
    };
  }

  /**
   * Domain knowledge retrieval and intent evaluation
   */
  private async generateAssistantReply(
    userId: string | null,
    query: string
  ): Promise<{ text: string; metadata?: any }> {
    const text = query.trim().toLowerCase();

    // 1. Specific Order Number lookup (e.g., ORD-2026-000101)
    const orderMatch = query.match(/ORD-\d{4}-\w+/i);
    if (orderMatch) {
      const orderNumber = orderMatch[0].toUpperCase();
      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: { shipment: true },
      });

      if (order) {
        if (userId && order.userId !== userId) {
          return {
            text: `Order ${orderNumber} belongs to another account. Please ensure you are logged into the correct customer profile.`,
          };
        }

        let shippingInfo = 'Your items are being carefully packed at our warehouse.';
        if (order.shipment) {
          shippingInfo = `Dispatched via ${order.shipment.courierName} (AWB: ${order.shipment.trackingNumber}).`;
        }

        return {
          text: `Order ${order.orderNumber} is currently in '${order.status}' status. ${shippingInfo} Grand Total: INR ${(order.totalMinor / 100).toFixed(2)}.`,
          metadata: { orderId: order.id, status: order.status },
        };
      }
    }

    // 2. General Order Tracking Intent
    if (
      text.includes('where is my order') ||
      text.includes('track my order') ||
      text.includes('track order') ||
      text.includes('order status')
    ) {
      if (userId) {
        const latestOrder = await this.prisma.order.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          include: { shipment: true },
        });

        if (latestOrder) {
          const dispatchInfo = latestOrder.shipment
            ? `It has shipped via ${latestOrder.shipment.courierName} (Tracking #: ${latestOrder.shipment.trackingNumber}).`
            : `It is currently '${latestOrder.status}'.`;

          return {
            text: `Your most recent order ${latestOrder.orderNumber} was placed on ${new Date(latestOrder.createdAt).toLocaleDateString('en-IN')}. ${dispatchInfo} You can view full tracking on your Orders page.`,
            metadata: { orderId: latestOrder.id },
          };
        } else {
          return {
            text: 'You do not have any past or active orders on your account yet. Let us know if you need help choosing a product!',
          };
        }
      } else {
        return {
          text: 'To check your order status, please provide your order reference number (for example, ORD-2026-000101) or sign in to your account.',
        };
      }
    }

    // 3. Human Escalation / Hand-off Intent
    if (
      text.includes('agent') ||
      text.includes('human') ||
      text.includes('representative') ||
      text.includes('support team') ||
      text.includes('speak to someone')
    ) {
      if (userId) {
        // Auto-create a high-priority support ticket
        try {
          const ticket = await this.supportService.createTicket(userId, {
            category: TicketCategory.OTHER,
            priority: TicketPriority.HIGH,
            subject: 'Customer requested human assistance via AI Live Chat',
            message: `User query: "${query}". Initiated from AI support chat.`,
          });

          return {
            text: `I have connected you with our customer support team! A support ticket (#${ticket.ticketNumber}) has been created with HIGH priority. One of our specialists will reply shortly.`,
            metadata: { escalated: true, ticketId: ticket.id, ticketNumber: ticket.ticketNumber },
          };
        } catch {
          // Fallback if ticket creation fails
        }
      }

      return {
        text: "I'd be glad to connect you with our support specialists. Please create a ticket in the Support section or email us at support@ecommerce.local.",
        metadata: { escalated: true },
      };
    }

    // 4. Returns & Refunds Intent
    if (
      text.includes('return') ||
      text.includes('refund') ||
      text.includes('replace') ||
      text.includes('exchange')
    ) {
      return {
        text: 'We provide a 7-day hassle-free return policy on all delivered items. You can initiate a return directly from your Orders page by clicking "Return Item" and uploading photo proof. Once inspected at our warehouse, refunds are processed back to your original payment source within 3-5 business days.',
      };
    }

    // 5. Cancellation Policy Intent
    if (text.includes('cancel')) {
      return {
        text: 'You can cancel any order free of charge before it leaves our warehouse for shipment. Simply visit your Orders page and select "Cancel Order". If paid online, your refund will be immediately initiated.',
      };
    }

    // 6. Shipping & Delivery Policy Intent
    if (
      text.includes('shipping') ||
      text.includes('delivery') ||
      text.includes('shipping fee') ||
      text.includes('how long')
    ) {
      return {
        text: 'We offer FREE shipping on all orders of ₹999 or higher (standard shipping is ₹99 for smaller orders). Packages are dispatched within 24 hours and delivered in 3 to 5 business days across India via Blue Dart and Delhivery.',
      };
    }

    // 7. FAQ Knowledge Base fallback search
    const words = text.split(/\s+/).filter((w) => w.length > 3);
    if (words.length > 0) {
      const faq = await this.prisma.faqItem.findFirst({
        where: {
          OR: words.map((w) => ({
            question: { contains: w, mode: 'insensitive' },
          })),
        },
      });

      if (faq) {
        return { text: `${faq.answer}` };
      }
    }

    // 8. General Helpful Assistant Response
    return {
      text: "Hello! I am your Apex Support Assistant. I can help you track orders, guide you through returns or cancellations, answer shipping questions, or connect you with a human representative. How can I help you today?",
    };
  }

  /**
   * Retrieve message history for an active session
   */
  async getSessionMessages(sessionId: string) {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
