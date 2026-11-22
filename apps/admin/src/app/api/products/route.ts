import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DATA_FILE = path.resolve(process.cwd(), '../../data/products.json');

function getProductsFilePath(): string {
  if (fs.existsSync(DATA_FILE)) return DATA_FILE;
  const rootPath = path.resolve(process.cwd(), '../data/products.json');
  if (fs.existsSync(rootPath)) return rootPath;
  const projectRoot = '/Users/adityayadav/ecommerce-platform/data/products.json';
  if (fs.existsSync(projectRoot)) return projectRoot;
  return DATA_FILE;
}

function readProducts(): any[] {
  try {
    const filePath = getProductsFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading products:', err);
  }
  return [];
}

function writeProducts(products: any[]) {
  try {
    const filePath = getProductsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing products:', err);
  }
}

function triggerNeonSync() {
  try {
    exec('cd /Users/adityayadav/ecommerce-platform/apps/api && ./node_modules/.bin/ts-node prisma/sync-products.ts', (err) => {
      if (err) console.error('Postgres sync error:', err.message);
      else console.log('Successfully synced products to Neon PostgreSQL');
    });
  } catch (e) {
    console.error('Failed to trigger Postgres sync:', e);
  }
}

export async function GET() {
  const products = readProducts();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const products = readProducts();

    const normalizedSku = (body.sku || `SKU-${Date.now()}`).toUpperCase().trim();
    const slug = (body.slug || body.name || `product-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const newProduct = {
      id: body.id || `prod-${Date.now()}`,
      slug,
      sku: normalizedSku,
      name: body.name || 'Untitled Product',
      category: body.category || 'General',
      brand: body.brand || 'Moonlet',
      priceMinor: typeof body.priceMinor === 'number' ? body.priceMinor : Math.round((parseFloat(body.price) || 99) * 100),
      mrpMinor: body.mrpMinor || Math.round((body.priceMinor || 9900) * 1.35),
      quantityOnHand: typeof body.quantityOnHand === 'number' ? body.quantityOnHand : (parseInt(body.stock, 10) || 10),
      reserved: 0,
      status: body.status || 'Active',
      inStock: true,
      rating: body.rating || 5.0,
      reviewsCount: body.reviewsCount || 1,
      variant: body.variant || 'Standard',
      variantId: body.variantId || `var-${Date.now()}`,
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : [
        {
          id: `img-${Date.now()}`,
          url: body.imageUrl || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&auto=format&fit=crop&q=80',
          altText: body.name,
          isPrimary: true,
        }
      ],
      imageUrl: body.imageUrl || (body.images && body.images[0]?.url) || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=700&auto=format&fit=crop&q=80',
      monthlySales: body.monthlySales || [5, 12, 18, 24, 30, 38, 45],
    };

    const updated = [newProduct, ...products.filter((p: any) => p.id !== newProduct.id && p.sku !== newProduct.sku)];
    writeProducts(updated);
    triggerNeonSync();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const products = readProducts();

    const targetId = body.id;
    const targetSku = body.sku ? body.sku.toUpperCase().trim() : null;

    const existingIndex = products.findIndex((p: any) => p.id === targetId || (targetSku && p.sku === targetSku));
    if (existingIndex === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const current = products[existingIndex];
    const updatedPriceMinor = typeof body.priceMinor === 'number' ? body.priceMinor : (body.price ? Math.round(parseFloat(body.price) * 100) : current.priceMinor);
    const updatedStock = typeof body.quantityOnHand === 'number' ? body.quantityOnHand : (body.stock ? parseInt(body.stock, 10) : current.quantityOnHand);

    const updatedProduct = {
      ...current,
      name: body.name || current.name,
      category: body.category || current.category,
      brand: body.brand || current.brand,
      sku: targetSku || current.sku,
      priceMinor: updatedPriceMinor,
      mrpMinor: body.mrpMinor || current.mrpMinor || Math.round(updatedPriceMinor * 1.35),
      quantityOnHand: updatedStock,
      status: body.status || current.status,
      variant: body.variant || current.variant,
      imageUrl: body.imageUrl || current.imageUrl,
      images: body.imageUrl ? [{ id: `img-${Date.now()}`, url: body.imageUrl, altText: body.name || current.name, isPrimary: true }] : current.images,
    };

    products[existingIndex] = updatedProduct;
    writeProducts(products);
    triggerNeonSync();

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const sku = searchParams.get('sku');

    let bodyId: string | null = null;
    try {
      const body = await req.json();
      bodyId = body.id || body.sku;
    } catch {
      // json body optional if using query params
    }

    const target = id || sku || bodyId;
    if (!target) {
      return NextResponse.json({ error: 'Product ID or SKU is required' }, { status: 400 });
    }

    const products = readProducts();
    const filtered = products.filter((p: any) => p.id !== target && p.sku !== target);

    if (filtered.length === products.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    writeProducts(filtered);
    triggerNeonSync();

    return NextResponse.json({ success: true, deletedId: target });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
