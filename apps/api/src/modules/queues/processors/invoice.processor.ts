import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES, JOBS } from '../queues.constants.js';
import { InvoiceService } from '../../orders/invoice.service.js';

@Processor(QUEUES.INVOICE)
export class InvoiceProcessor extends WorkerHost {
  private readonly logger = new Logger(InvoiceProcessor.name);

  constructor(private readonly invoiceService: InvoiceService) {
    super();
  }

  async process(job: Job<{ orderId: string }>): Promise<any> {
    this.logger.log(`Processing invoice generation job ${job.id} for order ${job.data.orderId}`);

    if (job.name === JOBS.INVOICE.GENERATE) {
      const { orderId } = job.data;
      const result = await this.invoiceService.getOrCreateInvoice(orderId);
      this.logger.log(
        `Successfully generated and persisted tax invoice ${result.invoice.invoiceNumber} for order ${orderId}`
      );
      return {
        invoiceNumber: result.invoice.invoiceNumber,
        filename: result.filename,
      };
    }

    this.logger.warn(`Unrecognized invoice job name '${job.name}'`);
    return null;
  }
}
