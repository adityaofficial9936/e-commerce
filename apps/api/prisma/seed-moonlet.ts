import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌙 Seeding Moonlet luxury jewelry catalog into Neon PostgreSQL...');

  const content = fs.readFileSync('/Users/adityayadav/ecommerce-platform/apps/web/src/app/products/page.tsx', 'utf-8');
  const match = content.match(/const JEWELRY_CATALOG: ProductItem\[\] = (\[[\s\S]*?\n\];)/);
  if (!match) {
    throw new Error('Could not find JEWELRY_CATALOG');
  }
  const catalog = eval(match[1]);
  console.log(`Parsed ${catalog.length} items from JEWELRY_CATALOG.`);

  // 1. Ensure Brand
  const brand = await prisma.brand.upsert({
    where: { slug: 'moonlet' },
    update: { name: 'Moonlet' },
    create: {
      name: 'Moonlet',
      slug: 'moonlet',
    },
  });

  // 2. Ensure Categories
  const categories = [...new Set(catalog.map((c: any) => c.category))] as string[];
  const catMap = new Map<string, string>();

  for (const cat of categories) {
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dbCat = await prisma.category.upsert({
      where: { slug },
      update: { name: cat },
      create: {
        name: cat,
        slug,
        description: `${cat} Collection`,
      },
    });
    catMap.set(cat, dbCat.id);
  }

  // 3. Upsert Products, Variants, Inventory & Images
  for (const item of catalog) {
    const catId = catMap.get(item.category)!;
    const slug = item.slug;
    const desc = `${item.material} - ${item.finish}`;
    const sku = `SKU-${item.id.toUpperCase()}`;
    const qty = 25;

    // Upsert product
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: item.name,
        description: desc,
        categoryId: catId,
        brandId: brand.id,
        isPublished: true,
      },
      create: {
        id: item.id,
        name: item.name,
        slug,
        description: desc,
        categoryId: catId,
        brandId: brand.id,
        isPublished: true,
      },
    });

    // Upsert variant
    const variant = await prisma.productVariant.upsert({
      where: { sku },
      update: {
        productId: product.id,
        title: `${item.finish} Edition`,
        priceMinor: item.priceMinor,
        mrpMinor: item.mrpMinor,
        attributes: { finish: item.finish, material: item.material },
      },
      create: {
        id: item.variantId || `var-${item.id}`,
        productId: product.id,
        sku,
        title: `${item.finish} Edition`,
        priceMinor: item.priceMinor,
        mrpMinor: item.mrpMinor,
        currency: 'INR',
        attributes: { finish: item.finish, material: item.material },
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

    // Upsert Image
    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });
    await prisma.productImage.create({
      data: {
        id: `img-${item.id}`,
        productId: product.id,
        url: item.imageUrl,
        altText: item.name,
        sortOrder: 0,
      },
    });

    console.log(`✓ Seeded: ${item.name} (₹${item.priceMinor / 100})`);
  }

  const count = await prisma.product.count();
  console.log(`✨ Successfully seeded Moonlet catalog! Total products in Neon DB: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
