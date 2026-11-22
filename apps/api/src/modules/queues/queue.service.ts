import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES, JOBS } from './queues.constants.js';

export interface QueueHealthMetrics {
  name: string;
  isPaused: boolean;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUES.INVOICE) private readonly invoiceQueue: Queue,
    @InjectQueue(QUEUES.SEARCH_SYNC) private readonly searchSyncQueue: Queue,
    @InjectQueue(QUEUES.MAINTENANCE) private readonly maintenanceQueue: Queue
  ) {}

  /**
   * Enqueue a transactional email job
   */
  async enqueueEmail(
    jobName: string,
    payload: {
      to: string;
      subject: string;
      template: string;
      context: Record<string, any>;
      attachments?: Array<{ filename: string; content: string; contentType?: string }>;
    }
  ) {
    this.logger.log(`Enqueuing email job '${jobName}' for recipient: ${payload.to}`);
    return this.emailQueue.add(jobName, payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  }

  /**
   * Enqueue an invoice generation job
   */
  async enqueueInvoiceGeneration(orderId: string) {
    this.logger.log(`Enqueuing invoice generation job for order ${orderId}`);
    return this.invoiceQueue.add(
      JOBS.INVOICE.GENERATE,
      { orderId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      }
    );
  }

  /**
   * Enqueue a search sync indexing job
   */
  async enqueueSearchSync(productId: string) {
    this.logger.log(`Enqueuing search sync job for product ${productId}`);
    return this.searchSyncQueue.add(
      JOBS.SEARCH_SYNC.INDEX_PRODUCT,
      { productId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 50,
      }
    );
  }

  /**
   * Enqueue a search delete job
   */
  async enqueueSearchDelete(productId: string) {
    this.logger.log(`Enqueuing search removal job for product ${productId}`);
    return this.searchSyncQueue.add(
      JOBS.SEARCH_SYNC.DELETE_PRODUCT,
      { productId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 50,
      }
    );
  }

  /**
   * Enqueue stock reservation maintenance sweep
   */
  async enqueueMaintenanceSweep() {
    this.logger.log('Enqueuing maintenance reservation sweep job');
    return this.maintenanceQueue.add(
      JOBS.MAINTENANCE.SWEEP_RESERVATIONS,
      {},
      {
        removeOnComplete: 20,
        removeOnFail: 50,
      }
    );
  }

  /**
   * Inspect all queues and gather health metrics
   */
  async getAllQueueMetrics(): Promise<QueueHealthMetrics[]> {
    const queues = [
      { name: QUEUES.EMAIL, instance: this.emailQueue },
      { name: QUEUES.INVOICE, instance: this.invoiceQueue },
      { name: QUEUES.SEARCH_SYNC, instance: this.searchSyncQueue },
      { name: QUEUES.MAINTENANCE, instance: this.maintenanceQueue },
    ];

    const results: QueueHealthMetrics[] = [];

    for (const q of queues) {
      try {
        const [counts, isPaused] = await Promise.all([
          q.instance.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
          q.instance.isPaused(),
        ]);

        results.push({
          name: q.name,
          isPaused,
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
        });
      } catch (err: any) {
        this.logger.warn(`Failed to inspect queue '${q.name}': ${err.message}`);
        results.push({
          name: q.name,
          isPaused: false,
          waiting: -1,
          active: -1,
          completed: -1,
          failed: -1,
          delayed: -1,
        });
      }
    }

    return results;
  }
}
