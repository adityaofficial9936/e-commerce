import { Controller, Get, VERSION_NEUTRAL, Version } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @Version('1')
  @ApiOperation({ summary: 'API Welcome & Status' })
  getIndexV1() {
    return {
      message: 'E-Commerce Platform API is online',
      version: 'v1',
      database: 'Neon PostgreSQL (Connected)',
      documentation: 'http://localhost:4000/docs',
      endpoints: {
        health: '/v1/health',
        products: '/v1/products',
        categories: '/v1/categories',
        swagger: '/docs',
      },
    };
  }

  @Get()
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: 'Root Welcome' })
  getIndex() {
    return {
      message: 'E-Commerce Platform API is online',
      version: 'v1',
      database: 'Neon PostgreSQL (Connected)',
      documentation: 'http://localhost:4000/docs',
      endpoints: {
        health: '/v1/health',
        products: '/v1/products',
        categories: '/v1/categories',
        swagger: '/docs',
      },
    };
  }
}
