import { QueueService } from './queue.service.js';
import { QUEUES, JOBS } from './queues.constants.js';

describe('QueueService', () => {
  let service: QueueService;
  let mockEmailQueue: any;
  let mockInvoiceQueue: any;
  let mockSearchSyncQueue: any;
  let mockMaintenanceQueue: any;

  beforeEach(() => {
    mockEmailQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 2, active: 1, completed: 50, failed: 0, delayed: 0 }),
      isPaused: jest.fn().mockResolvedValue(false),
    };

    mockInvoiceQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-2' }),
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 30, failed: 1, delayed: 0 }),
      isPaused: jest.fn().mockResolvedValue(false),
    };

    mockSearchSyncQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-3' }),
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 5, active: 2, completed: 100, failed: 0, delayed: 0 }),
      isPaused: jest.fn().mockResolvedValue(false),
    };

    mockMaintenanceQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-4' }),
      getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 10, failed: 0, delayed: 0 }),
      isPaused: jest.fn().mockResolvedValue(false),
    };

    service = new QueueService(
      mockEmailQueue,
      mockInvoiceQueue,
      mockSearchSyncQueue,
      mockMaintenanceQueue
    );
  });

  it('1. Enqueues transactional email job with exponential backoff options', async () => {
    await service.enqueueEmail('test-email-job', {
      to: 'buyer@example.com',
      subject: 'Order confirmation',
      template: 'order-confirmed',
      context: { orderId: 'ord-123' },
    });

    expect(mockEmailQueue.add).toHaveBeenCalledWith(
      'test-email-job',
      expect.objectContaining({ to: 'buyer@example.com' }),
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      })
    );
  });

  it('2. Enqueues invoice generation job', async () => {
    await service.enqueueInvoiceGeneration('ord-999');

    expect(mockInvoiceQueue.add).toHaveBeenCalledWith(
      JOBS.INVOICE.GENERATE,
      { orderId: 'ord-999' },
      expect.objectContaining({ attempts: 3 })
    );
  });

  it('3. Enqueues search sync and delete jobs', async () => {
    await service.enqueueSearchSync('prod-1');
    expect(mockSearchSyncQueue.add).toHaveBeenCalledWith(
      JOBS.SEARCH_SYNC.INDEX_PRODUCT,
      { productId: 'prod-1' },
      expect.any(Object)
    );

    await service.enqueueSearchDelete('prod-1');
    expect(mockSearchSyncQueue.add).toHaveBeenCalledWith(
      JOBS.SEARCH_SYNC.DELETE_PRODUCT,
      { productId: 'prod-1' },
      expect.any(Object)
    );
  });

  it('4. Gathers consolidated health metrics across all queues', async () => {
    const metrics = await service.getAllQueueMetrics();

    expect(metrics).toHaveLength(4);
    expect(metrics.find((m) => m.name === QUEUES.EMAIL)).toEqual(
      expect.objectContaining({
        name: QUEUES.EMAIL,
        waiting: 2,
        active: 1,
        completed: 50,
      })
    );
  });
});
