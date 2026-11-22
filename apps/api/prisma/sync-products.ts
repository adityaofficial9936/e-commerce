import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function syncProductsToPostgres() {
  console.log('🔄 Syncing products from data/products.json to Neon PostgreSQL...');
  
  const filePath = path.resolve(__dirname, '../../../data/products.json');
  if (!fs.existsSync(filePath)) {
    console.error('❌ data/products.json not found at:', filePath);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const products = JSON.parse(raw);
  console.log(`Found ${products.length} products to sync.`);

  // 1. Ensure Categories exist
  const categoriesMap = new Map<string, string>();
  const categoryNames = Array.from(new Set(products.map((p: any) => p.category || 'General')));

  for (const catName of categoryNames) {
    const slug = (catName as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name: catName as string },
      create: {
        name: catName as string,
        slug,
        description: `${catName} category`,
      },
    });
    categoriesMap.set(catName as string, cat.id);
  }

  // 2. Sync Products
  for (const p of products) {
    const catId = categoriesMap.get(p.category || 'General') || categoriesMap.values().next().value;
    const slug = (p.slug || p.name || `product-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const priceMinor = typeof p.priceMinor === 'number' ? p.priceMinor : 9900;
    const sku = (p.sku || `SKU-${Date.now()}`).toUpperCase().trim();
    const qty = typeof p.quantityOnHand === 'number' ? p.quantityOnHand : (parseInt(p.stock, 10) || 10);
    const imageUrl = p.imageUrl || (p.images && p.images[0]?.url) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700';

    // Upsert product by slug
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description || `${p.name} - Professional industrial product`,
        isPublished: true,
      },
      create: {
        name: p.name,
        slug,
        description: p.description || `${p.name} - Professional industrial product`,
        categoryId: catId,
        isPublished: true,
      },
    });

    // Upsert Variant
    const variant = await prisma.productVariant.upsert({
      where: { sku },
      update: {
        title: p.variant || 'Standard Edition',
        priceMinor,
        mrpMinor: p.mrpMinor || Math.round(priceMinor * 1.35),
        attributes: { variant: p.variant || 'Standard' },
      },
      create: {
        productId: product.id,
        sku,
        title: p.variant || 'Standard Edition',
        priceMinor,
        mrpMinor: p.mrpMinor || Math.round(priceMinor * 1.35),
        attributes: { variant: p.variant || 'Standard' },
      },
    });

    // Upsert Inventory
    await prisma.inventoryItem.upsert({
      where: { variantId: variant.id },
      update: {
        quantity: qty,
      },
      create: {
        variantId: variant.id,
        quantity: qty,
        reserved: 0,
      },
    });

    // Add Primary Image if not exists
    const existingImg = await prisma.productImage.findFirst({
      where: { productId: product.id },
    });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: imageUrl.length > 500 ? 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700' : imageUrl,
          altText: p.name,
          sortOrder: 0,
        },
      });
    }

    console.log(`✅ Synced: ${p.name} (SKU: ${sku}) -> Neon Postgres`);
  }

  const finalCount = await prisma.product.count();
  const variantsCount = await prisma.productVariant.count();
  const inventoryCount = await prisma.inventoryItem.count();
  console.log(`🎉 Finished! Neon PostgreSQL has:
   - ${finalCount} Products
   - ${variantsCount} Product Variants
   - ${inventoryCount} Inventory Items`);
}

syncProductsToPostgres()
  .catch((err) => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
