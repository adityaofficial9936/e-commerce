import { Controller, Get, HttpStatus, Res, Optional, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';
import { QueueService } from '../../modules/queues/queue.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Optional() private readonly queueService?: QueueService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Standard liveness & readiness probe for load balancers' })
  @ApiResponse({ status: 200, description: 'All core backing services are operational' })
  @ApiResponse({ status: 503, description: 'One or more backing services are degraded or down' })
  async checkHealth(@Res() res: Response) {
    const checks: {
      database: 'up' | 'down';
      redis: 'up' | 'down';
      [key: string]: string;
    } = {
      database: 'down',
      redis: 'down',
    };

    let isHealthy = true;

    // Database check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch {
      isHealthy = false;
    }

    // Redis check
    try {
      const pingRes = await this.redis.ping();
      if (pingRes === 'PONG') {
        checks.redis = 'up';
      } else {
        isHealthy = false;
      }
    } catch {
      isHealthy = false;
    }

    const httpStatus = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: checks,
      },
    });
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Deep diagnostics telemetry endpoint for SRE and monitoring' })
  @ApiResponse({ status: 200, description: 'Detailed telemetry generated' })
  async checkDetailedHealth(@Res() res: Response) {
    const startTime = Date.now();
    let isHealthy = true;

    // 1. Database Latency Check
    let dbLatencyMs = -1;
    let dbStatus: 'up' | 'down' = 'down';
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'up';
    } catch {
      isHealthy = false;
    }

    // 2. Redis Latency Check
    let redisLatencyMs = -1;
    let redisStatus: 'up' | 'down' = 'down';
    try {
      const redisStart = Date.now();
      const ping = await this.redis.ping();
      if (ping === 'PONG') {
        redisLatencyMs = Date.now() - redisStart;
        redisStatus = 'up';
      } else {
        isHealthy = false;
      }
    } catch {
      isHealthy = false;
    }

    // 3. BullMQ Queues Inspection
    let queueMetrics: any[] = [];
    if (this.queueService) {
      try {
        queueMetrics = await this.queueService.getAllQueueMetrics();
      } catch {
        // queue service error does not fail the whole probe
      }
    }

    // 4. Node Process Metrics
    const memory = process.memoryUsage();
    const processMetrics = {
      uptimeSeconds: Math.floor(process.uptime()),
      heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      nodeVersion: process.version,
    };

    const httpStatus = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        probeLatencyMs: Date.now() - startTime,
        system: processMetrics,
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        redis: {
          status: redisStatus,
          latencyMs: redisLatencyMs,
        },
        queues: queueMetrics,
      },
    });
  }
}
