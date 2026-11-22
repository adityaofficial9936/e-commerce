import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../queues.constants.js';
import { NotificationsService } from '../../notifications/notifications.service.js';

@Processor(QUEUES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing email job ${job.id} (${job.name}) for ${job.data.to}`);

    const result = await this.notificationsService.sendDirectEmail({
      to: job.data.to,
      subject: job.data.subject,
      html: job.data.html || `<p>${job.data.subject}</p>`,
      attachments: job.data.attachments,
    });

    return result;
  }
}
