export const Permissions = {
  // Catalog
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  CATEGORY_MANAGE: 'category:manage',

  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_ADJUST: 'inventory:adjust',

  // Orders
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',

  // Refunds
  REFUND_REQUEST: 'refund:request',
  REFUND_APPROVE: 'refund:approve',
  REFUND_EXECUTE: 'refund:execute',

  // Customers
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_UPDATE: 'customer:update',

  // Promotions & CMS
  COUPON_MANAGE: 'coupon:manage',
  CMS_MANAGE: 'cms:manage',

  // Support
  TICKET_READ: 'ticket:read',
  TICKET_UPDATE: 'ticket:update',
  TICKET_REPLY: 'ticket:reply',
  TICKET_ASSIGN: 'ticket:assign',

  // Reports
  REPORT_CATALOG: 'report:catalog',
  REPORT_ORDERS: 'report:orders',
  REPORT_SUPPORT: 'report:support',
  REPORT_MARKETING: 'report:marketing',
  REPORT_FINANCE: 'report:finance',

  // Settings & Staff
  STAFF_MANAGE: 'staff:manage',
  ROLE_MANAGE: 'role:manage',
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_READ: 'audit:read',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
