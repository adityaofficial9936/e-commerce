import { InvoiceService } from './invoice.service.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findUnique: jest.fn(),
      },
      invoice: {
        create: jest.fn(),
      },
    };

    service = new InvoiceService(mockPrisma as PrismaService);
  });

  const baseOrder = {
    id: 'ord-1',
    orderNumber: 'ORD-2026-000123',
    userId: 'user-1',
    paymentMethod: 'RAZORPAY',
    subtotalMinor: 100000,
    discountMinor: 10000,
    shippingMinor: 0,
    taxMinor: 16200, // 18% GST on 900.00
    totalMinor: 106200,
    items: [
      {
        productName: 'Pro Running Shoes',
        variantTitle: 'Size 9 / Navy',
        sku: 'SHOE-09-NVY',
        quantity: 1,
        unitPriceMinor: 90000,
        totalMinor: 90000,
      },
    ],
    user: {
      id: 'user-1',
      name: 'Aditya Yadav',
      email: 'aditya@example.com',
      phone: '+919876543210',
    },
    invoice: null,
  };

  describe('getOrCreateInvoice', () => {
    it('should calculate intra-state GST (CGST 9% + SGST 9%) for Maharashtra orders', async () => {
      const orderInMH = {
        ...baseOrder,
        address: {
          name: 'Aditya Yadav',
          phone: '+919876543210',
          street: '123 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400020',
          country: 'India',
        },
      };

      mockPrisma.order.findUnique.mockResolvedValue(orderInMH);
      mockPrisma.invoice.create.mockImplementation((args: any) => ({
        id: 'inv-1',
        ...args.data,
      }));

      const result = await service.getOrCreateInvoice('ord-1');

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          invoiceNumber: 'INV-2026-000123',
          cgstMinor: 8100, // 16200 / 2
          sgstMinor: 8100,
          igstMinor: 0,
          totalMinor: 106200,
        }),
      });

      expect(result.invoice.invoiceNumber).toBe('INV-2026-000123');
      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.pdfBuffer.toString('utf-8')).toContain('%PDF-1.4');
    });

    it('should calculate inter-state GST (IGST 18%) for non-Maharashtra orders', async () => {
      const orderInKA = {
        ...baseOrder,
        address: {
          name: 'Priya Sharma',
          phone: '+919876543211',
          street: 'Indiranagar 100ft Rd',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560038',
          country: 'India',
        },
      };

      mockPrisma.order.findUnique.mockResolvedValue(orderInKA);
      mockPrisma.invoice.create.mockImplementation((args: any) => ({
        id: 'inv-2',
        ...args.data,
      }));

      const result = await service.getOrCreateInvoice('ord-1');

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cgstMinor: 0,
          sgstMinor: 0,
          igstMinor: 16200,
        }),
      });

      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
    });

    it('should reuse existing invoice if already present in database', async () => {
      const existingInvoice = {
        id: 'inv-existing',
        invoiceNumber: 'INV-2026-000123',
        orderId: 'ord-1',
        subtotalMinor: 100000,
        taxMinor: 16200,
        cgstMinor: 8100,
        sgstMinor: 8100,
        igstMinor: 0,
        shippingMinor: 0,
        discountMinor: 10000,
        totalMinor: 106200,
        issuedAt: new Date(),
      };

      const orderWithInvoice = {
        ...baseOrder,
        address: {
          name: 'Aditya Yadav',
          phone: '+919876543210',
          street: '123 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400020',
          country: 'India',
        },
        invoice: existingInvoice,
      };

      mockPrisma.order.findUnique.mockResolvedValue(orderWithInvoice);

      const result = await service.getOrCreateInvoice('ord-1');

      expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
      expect(result.invoice.id).toBe('inv-existing');
    });
  });

  describe('getInvoicePdf', () => {
    it('should throw ForbiddenException if order does not belong to customer', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'ord-1',
        userId: 'other-user',
      });

      await expect(service.getInvoicePdf('ord-1', 'customer-1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.getInvoicePdf('ord-nonexistent', 'customer-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
