import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  // Catalog
  'product:create',
  'product:read',
  'product:update',
  'product:delete',
  'category:manage',
  // Inventory
  'inventory:read',
  'inventory:update',
  'inventory:adjust',
  // Orders
  'order:read',
  'order:update',
  'order:cancel',
  // Refunds
  'refund:request',
  'refund:approve',
  'refund:execute',
  // Customers
  'customer:read',
  'customer:update',
  // Promotions & CMS
  'coupon:manage',
  'cms:manage',
  // Support
  'ticket:read',
  'ticket:update',
  'ticket:reply',
  'ticket:assign',
  // Reports
  'report:catalog',
  'report:orders',
  'report:support',
  'report:marketing',
  'report:finance',
  // Settings & Staff
  'staff:manage',
  'role:manage',
  'settings:manage',
  'audit:read',
];

const roles = [
  {
    name: 'Super Admin',
    description: 'Owner or tech lead, full control across all modules',
    permissions: permissions, // All permissions
  },
  {
    name: 'Catalog Manager',
    description: 'Manages products, categories, prices, and views catalog reports',
    permissions: [
      'product:create',
      'product:read',
      'product:update',
      'product:delete',
      'category:manage',
      'inventory:read',
      'inventory:update',
      'order:read',
      'coupon:manage',
      'cms:manage',
      'report:catalog',
    ],
  },
  {
    name: 'Order Manager',
    description: 'Packs, ships, handles inventory and customer returns',
    permissions: [
      'product:read',
      'inventory:read',
      'inventory:update',
      'inventory:adjust',
      'order:read',
      'order:update',
      'refund:request',
      'customer:read',
      'ticket:read',
      'report:orders',
    ],
  },
  {
    name: 'Support Agent',
    description: 'Answers customer tickets and chat enquiries',
    permissions: [
      'product:read',
      'inventory:read',
      'order:read',
      'refund:request',
      'customer:read',
      'ticket:read',
      'ticket:update',
      'ticket:reply',
      'ticket:assign',
    ],
  },
  {
    name: 'Support Lead',
    description: 'Support agent permissions plus refund approvals up to configured limits',
    permissions: [
      'product:read',
      'inventory:read',
      'order:read',
      'refund:request',
      'refund:approve',
      'customer:read',
      'ticket:read',
      'ticket:update',
      'ticket:reply',
      'ticket:assign',
      'report:support',
    ],
  },
  {
    name: 'Marketing Manager',
    description: 'Banners, coupons, home page layouts, CMS pages, SEO',
    permissions: [
      'product:read',
      'customer:read',
      'coupon:manage',
      'cms:manage',
      'report:marketing',
    ],
  },
  {
    name: 'Finance Manager',
    description: 'Full refund execution, settlements, and financial reporting',
    permissions: [
      'order:read',
      'refund:request',
      'refund:approve',
      'refund:execute',
      'customer:read',
      'report:finance',
      'settings:manage',
    ],
  },
];

async function main() {
  console.log('Seeding permissions...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm },
      update: {},
      create: { name: perm },
    });
  }

  console.log('Seeding roles and mapping permissions...');
  for (const r of roles) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });

    for (const permName of r.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleRecord.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: roleRecord.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
