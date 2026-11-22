import { Module } from '@nestjs/common';
import { SupportController } from './support.controller.js';
import { AdminSupportController } from './admin-support.controller.js';
import { SupportService } from './support.service.js';
import { AiChatService } from './ai-chat.service.js';

@Module({
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService, AiChatService],
  exports: [SupportService, AiChatService],
})
export class SupportModule {}
