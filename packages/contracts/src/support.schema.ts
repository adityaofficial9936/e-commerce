import { z } from 'zod';
import { TicketCategory, TicketPriority, TicketStatus } from './enums.js';

export const CreateTicketSchema = z.object({
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority).optional().default(TicketPriority.NORMAL),
  orderId: z.string().uuid().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  attachments: z.array(z.string().url()).optional(),
});

export type CreateTicketDto = z.infer<typeof CreateTicketSchema>;

export const ReplyTicketSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  isInternal: z.boolean().optional().default(false),
  attachments: z.array(z.string().url()).optional(),
});

export type ReplyTicketDto = z.infer<typeof ReplyTicketSchema>;

export const UpdateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
});

export type UpdateTicketDto = z.infer<typeof UpdateTicketSchema>;

export const SendChatMessageSchema = z.object({
  sessionId: z.string().uuid().optional(),
  guestToken: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty'),
});

export type SendChatMessageDto = z.infer<typeof SendChatMessageSchema>;
