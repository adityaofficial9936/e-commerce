import {
  Injectable,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service.js';

export interface ReserveItemInput {
  variantId: string;
  quantity: number;
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reserve stock atomically for an order inside a transaction with row-level locks
   */
  async reserveStockForOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
    items: ReserveItemInput[]
  ) {
    const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL

    for (const item of items) {
      // 1. Lock the inventory row with SELECT ... FOR UPDATE
      const inventoryRows = await tx.$queryRaw<
        Array<{ id: string; variant_id: string; quantity: number; reserved: number }>
      >`
        SELECT id, variant_id, quantity, reserved 
        FROM inventory_items 
        WHERE variant_id = ${item.variantId}::uuid
        FOR UPDATE
      `;

      if (!inventoryRows || inventoryRows.length === 0) {
        throw new ConflictException(`Inventory record not found for variant ${item.variantId}`);
      }

      const inv = inventoryRows[0];
      const available = inv.quantity - inv.reserved;

      if (available < item.quantity) {
        throw new ConflictException({
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${Math.max(0, available)} units available for item ${item.variantId}`,
          details: [
            {
              field: `variantId:${item.variantId}`,
              issue: `Available: ${Math.max(0, available)}, Requested: ${item.quantity}`,
            },
          ],
        });
      }

      // 2. Increment reserved stock
      await tx.inventoryItem.update({
        where: { id: inv.id },
        data: {
          reserved: { increment: item.quantity },
        },
      });

      // 3. Create stock reservation entry
      await tx.stockReservation.create({
        data: {
          variantId: item.variantId,
          orderId,
          quantity: item.quantity,
          expiresAt: reservationExpiresAt,
        },
      });

      this.logger.debug(
        `Reserved ${item.quantity} units for variant ${item.variantId} on order ${orderId}`
      );
    }

    return { expiresAt: reservationExpiresAt };
  }

  /**
   * Release reserved stock back to available pool (e.g. on reservation expiry or order cancel)
   */
  async releaseReservation(tx: Prisma.TransactionClient, orderId: string) {
    const reservations = await tx.stockReservation.findMany({
      where: { orderId },
    });

    for (const res of reservations) {
      await tx.inventoryItem.update({
        where: { variantId: res.variantId },
        data: {
          reserved: { decrement: res.quantity },
        },
      });

      // Record stock movement audit
      await tx.stockMovement.create({
        data: {
          variantId: res.variantId,
          delta: 0, // Physical quantity didn't change, only reservation was released
          reason: 'RESERVATION_RELEASE',
          reference: `ORDER_CANCELLED_${orderId}`,
        },
      });
    }

    // Delete reservation records
    await tx.stockReservation.deleteMany({
      where: { orderId },
    });

    this.logger.log(`Released stock reservations for order ${orderId}`);
  }

  /**
   * Deduct stock permanently on payment capture / order confirmation
   */
  async deductStockOnPayment(tx: Prisma.TransactionClient, orderId: string) {
    const reservations = await tx.stockReservation.findMany({
      where: { orderId },
    });

    for (const res of reservations) {
      // Decrement both physical quantity and reserved counter
      await tx.inventoryItem.update({
        where: { variantId: res.variantId },
        data: {
          quantity: { decrement: res.quantity },
          reserved: { decrement: res.quantity },
        },
      });

      // Record permanent stock movement audit
      await tx.stockMovement.create({
        data: {
          variantId: res.variantId,
          delta: -res.quantity,
          reason: 'PURCHASE',
          reference: `ORDER_PAID_${orderId}`,
        },
      });
    }

    // Delete active reservations as they are now permanently deducted
    await tx.stockReservation.deleteMany({
      where: { orderId },
    });

    this.logger.log(`Permanently deducted stock for confirmed order ${orderId}`);
  }

  /**
   * Release any expired stock reservations across the entire system
   */
  async releaseExpiredReservations() {
    const now = new Date();
    const expiredReservations = await this.prisma.stockReservation.findMany({
      where: { expiresAt: { lt: now } },
      include: { order: true },
    });

    if (expiredReservations.length === 0) return { released: 0 };

    this.logger.log(`Found ${expiredReservations.length} expired reservations to release`);

    let releasedCount = 0;

    for (const res of expiredReservations) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // Decrement reserved stock
          await tx.inventoryItem.update({
            where: { variantId: res.variantId },
            data: { reserved: { decrement: res.quantity } },
          });

          // Log movement
          await tx.stockMovement.create({
            data: {
              variantId: res.variantId,
              delta: 0,
              reason: 'RESERVATION_RELEASE',
              reference: `EXPIRED_RESERVATION_${res.orderId}`,
            },
          });

          // Delete this reservation
          await tx.stockReservation.delete({ where: { id: res.id } });

          // If order is still PENDING_PAYMENT, mark it as CANCELLED due to expiry
          if (res.order.status === 'PENDING_PAYMENT') {
            await tx.order.update({
              where: { id: res.orderId },
              data: { status: 'CANCELLED' },
            });

            await tx.orderStatusHistory.create({
              data: {
                orderId: res.orderId,
                fromStatus: 'PENDING_PAYMENT',
                toStatus: 'CANCELLED',
                notes: 'Order cancelled automatically due to payment window expiration (15 mins)',
              },
            });
          }
        });

        releasedCount++;
      } catch (err: any) {
        this.logger.error(`Error releasing expired reservation ${res.id}: ${err.message}`);
      }
    }

    return { released: releasedCount };
  }
}
