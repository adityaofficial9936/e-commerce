import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { validateEnv } from './config/env.validation.js';
import { PrismaModule } from './core/prisma/prisma.module.js';
import { RedisModule } from './core/redis/redis.module.js';
import { HealthModule } from './core/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { RbacModule } from './modules/rbac/rbac.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { CouponsModule } from './modules/coupons/coupons.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { CheckoutModule } from './modules/checkout/checkout.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { ReturnsModule } from './modules/returns/returns.module.js';
import { SupportModule } from './modules/support/support.module.js';
import { QueuesModule } from './modules/queues/queues.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware.js';
import { AppController } from './app.controller.js';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env', '../../.env'],
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    PrismaModule,
    RedisModule,
    QueuesModule,
    NotificationsModule,
    HealthModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RbacModule,
    CatalogModule,
    MediaModule,
    SearchModule,
    CouponsModule,
    CartModule,
    InventoryModule,
    CheckoutModule,
    OrdersModule,
    PaymentsModule,
    ReturnsModule,
    SupportModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
