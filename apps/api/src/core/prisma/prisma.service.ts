import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL || '';
    const hostMatch = dbUrl.match(/@([^:/]+)/);
    this.logger.log(`Prisma initializing connection to host: ${hostMatch ? hostMatch[1] : 'unknown'}`);

    let retries = 3;
    while (retries > 0) {
      try {
        await this.$connect();
        this.logger.log('Connected to PostgreSQL successfully');
        break;
      } catch (err: any) {
        retries--;
        this.logger.warn(`Database connection attempt failed: ${err.message}. Retries remaining: ${retries}`);
        if (retries === 0) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
