import { HealthController } from './health.controller.js';
import { HttpStatus } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: any;
  let mockRedis: any;
  let mockQueueService: any;
  let mockResponse: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    mockRedis = {
      ping: jest.fn().mockResolvedValue('PONG'),
    };

    mockQueueService = {
      getAllQueueMetrics: jest.fn().mockResolvedValue([
        { name: 'email-queue', isPaused: false, waiting: 0, active: 0, completed: 10, failed: 0, delayed: 0 },
      ]),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    controller = new HealthController(mockPrisma, mockRedis, mockQueueService);
  });

  it('1. Returns 200 OK when all backing services are up', async () => {
    await controller.checkHealth(mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          services: {
            database: 'up',
            redis: 'up',
          },
        }),
      })
    );
  });

  it('2. Returns 503 SERVICE_UNAVAILABLE when database is down', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection lost'));

    await controller.checkHealth(mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: expect.objectContaining({
          status: 'degraded',
          services: {
            database: 'down',
            redis: 'up',
          },
        }),
      })
    );
  });

  it('3. Generates detailed health telemetry including latencies, queue metrics, and system stats', async () => {
    await controller.checkDetailedHealth(mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'healthy',
          database: expect.objectContaining({ status: 'up' }),
          redis: expect.objectContaining({ status: 'up' }),
          queues: expect.any(Array),
          system: expect.objectContaining({
            nodeVersion: expect.any(String),
            heapUsedMb: expect.any(Number),
          }),
        }),
      })
    );
  });
});
