export const QUEUES = {
  EMAIL: 'email-queue',
  INVOICE: 'invoice-queue',
  SEARCH_SYNC: 'search-sync-queue',
  MAINTENANCE: 'maintenance-queue',
} as const;

export const JOBS = {
  EMAIL: {
    SEND_WELCOME: 'send-welcome-email',
    SEND_ORDER_CONFIRMED: 'send-order-confirmed-email',
    SEND_ORDER_SHIPPED: 'send-order-shipped-email',
    SEND_REFUND_CONFIRMED: 'send-refund-confirmed-email',
  },
  INVOICE: {
    GENERATE: 'generate-order-invoice',
  },
  SEARCH_SYNC: {
    INDEX_PRODUCT: 'index-product',
    DELETE_PRODUCT: 'delete-product',
  },
  MAINTENANCE: {
    SWEEP_RESERVATIONS: 'sweep-expired-reservations',
  },
} as const;
