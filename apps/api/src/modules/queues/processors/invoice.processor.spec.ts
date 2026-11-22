import { InvoiceProcessor } from './invoice.processor.js';
import { JOBS } from '../queues.constants.js';

describe('InvoiceProcessor', () => {
  let processor: InvoiceProcessor;
  let mockInvoiceService: any;

  beforeEach(() => {
    mockInvoiceService = {
      getOrCreateInvoice: jest.fn().mockResolvedValue({
        invoice: {
          id: 'inv-1',
          invoiceNumber: 'INV-2026-000101',
        },
        filename: 'tax-invoice-ORD-2026-000101.pdf',
      }),
    };

    processor = new InvoiceProcessor(mockInvoiceService);
  });

  it('1. Successfully processes invoice generation job and delegates to InvoiceService', async () => {
    const mockJob: any = {
      id: 'job-99',
      name: JOBS.INVOICE.GENERATE,
      data: { orderId: 'ord-101' },
    };

    const result = await processor.process(mockJob);

    expect(mockInvoiceService.getOrCreateInvoice).toHaveBeenCalledWith('ord-101');
    expect(result).toEqual({
      invoiceNumber: 'INV-2026-000101',
      filename: 'tax-invoice-ORD-2026-000101.pdf',
    });
  });
});
