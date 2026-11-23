import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_NEON_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_6bxDNIT0kVLO@ep-withered-sound-bd4xjr2c-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require';

function getDb() {
  return neon(DEFAULT_NEON_URL);
}

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        coalesce(c.name, 'Jewelry') as category,
        coalesce(b.name, 'Moonlet') as brand,
        coalesce(pv.id, concat('var-', p.id)) as "variantId",
        coalesce(pv.sku, concat('SKU-', upper(p.id))) as sku,
        coalesce(pv.title, 'Standard Edition') as variant,
        coalesce(pv.price_minor, 99900) as "priceMinor",
        coalesce(pv.mrp_minor, 179900) as "mrpMinor",
        coalesce(inv.quantity, 25) as "quantityOnHand",
        coalesce(inv.reserved, 0) as reserved,
        'Active' as status,
        coalesce(img.url, 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800') as "imageUrl"
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      LEFT JOIN inventory_items inv ON inv.variant_id = pv.id
      LEFT JOIN LATERAL (
        SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order ASC LIMIT 1
      ) img ON true
      WHERE p.deleted_at IS NULL AND p.is_published = true
      ORDER BY p.created_at DESC;
    `;

    // Map to include images array
    const products = rows.map((r: any) => ({
      ...r,
      images: [
        {
          id: `img-${r.id}`,
          url: r.imageUrl,
          altText: r.name,
          isPrimary: true,
        },
      ],
      monthlySales: [12, 18, 24, 30, 36, 42, 50],
    }));

    return NextResponse.json(products);
  } catch (err: any) {
    console.error('Database query error in /api/products GET:', err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sql = getDb();

    const normalizedSku = (body.sku || `SKU-${Date.now()}`).toUpperCase().trim();
    const slug = (body.slug || body.name || `product-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const name = body.name || 'Untitled Jewelry Piece';
    const category = body.category || 'Jewelry';
    const brand = body.brand || 'Moonlet';
    const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const catId = `cat-${catSlug}`;
    const prodId = body.id || `prod-${Date.now()}`;
    const varId = body.variantId || `var-${prodId}`;
    const priceMinor =
      typeof body.priceMinor === 'number'
        ? body.priceMinor
        : Math.round((parseFloat(body.price) || 99) * 100);
    const mrpMinor = body.mrpMinor || Math.round(priceMinor * 1.6);
    const qty =
      typeof body.quantityOnHand === 'number'
        ? body.quantityOnHand
        : parseInt(body.stock, 10) || 20;

    const imageUrl =
      body.imageUrl ||
      (body.images && body.images[0]?.url) ||
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800';

    // 1. Ensure Category
    await sql`
      INSERT INTO categories (id, name, slug, description, created_at, updated_at)
      VALUES (${catId}, ${category}, ${catSlug}, ${category || ''}, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
    `;

    // 2. Ensure Brand
    await sql`
      INSERT INTO brands (id, name, slug, created_at, updated_at)
      VALUES ('brand-moonlet', 'Moonlet', 'moonlet', NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
    `;

    // 3. Upsert Product
    await sql`
      INSERT INTO products (id, category_id, brand_id, name, slug, description, is_published, created_at, updated_at)
      VALUES (${prodId}, ${catId}, 'brand-moonlet', ${name}, ${slug}, ${name}, true, NOW(), NOW())
      ON CONFLICT (slug) DO UPDATE SET 
        name = EXCLUDED.name, 
        category_id = EXCLUDED.category_id,
        is_published = true,
        updated_at = NOW();
    `;

    // 4. Upsert Product Variant
    await sql`
      INSERT INTO product_variants (id, product_id, sku, title, price_minor, mrp_minor, currency, attributes, created_at, updated_at)
      VALUES (${varId}, ${prodId}, ${normalizedSku}, ${body.variant || 'Standard Edition'}, ${priceMinor}, ${mrpMinor}, 'INR', '{"finish": "18k Gold-Tone"}'::jsonb, NOW(), NOW())
      ON CONFLICT (sku) DO UPDATE SET 
        price_minor = EXCLUDED.price_minor, 
        mrp_minor = EXCLUDED.mrp_minor, 
        title = EXCLUDED.title,
        updated_at = NOW();
    `;

    // 5. Upsert Inventory
    await sql`
      INSERT INTO inventory_items (id, variant_id, quantity, reserved, created_at, updated_at)
      VALUES (${`inv-${varId}`}, ${varId}, ${qty}, 0, NOW(), NOW())
      ON CONFLICT (variant_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW();
    `;

    // 6. Insert Primary Image
    await sql`
      INSERT INTO product_images (id, product_id, url, alt_text, sort_order, created_at)
      VALUES (${`img-${prodId}`}, ${prodId}, ${imageUrl}, ${name}, 0, NOW())
      ON CONFLICT (id) DO UPDATE SET url = EXCLUDED.url;
    `;

    const createdProduct = {
      id: prodId,
      slug,
      sku: normalizedSku,
      name,
      category,
      brand,
      priceMinor,
      mrpMinor,
      quantityOnHand: qty,
      reserved: 0,
      status: 'Active',
      variant: body.variant || 'Standard Edition',
      variantId: varId,
      imageUrl,
      images: [
        {
          id: `img-${prodId}`,
          url: imageUrl,
          altText: name,
          isPrimary: true,
        },
      ],
      monthlySales: [5, 12, 18, 25, 32, 38, 45],
    };

    return NextResponse.json({ success: true, product: createdProduct }, { status: 201 });
  } catch (err: any) {
    console.error('Error inserting product in Neon DB:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Database insert failed' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const sql = getDb();

    if (!body.id && !body.sku) {
      return NextResponse.json({ error: 'Product id or sku required' }, { status: 400 });
    }

    const priceMinor =
      typeof body.priceMinor === 'number'
        ? body.priceMinor
        : Math.round((parseFloat(body.price) || 99) * 100);
    const qty =
      typeof body.quantityOnHand === 'number'
        ? body.quantityOnHand
        : parseInt(body.stock, 10) || 20;

    if (body.sku) {
      await sql`
        UPDATE product_variants 
        SET price_minor = ${priceMinor}, updated_at = NOW()
        WHERE sku = ${body.sku.toUpperCase()};
      `;

      await sql`
        UPDATE inventory_items
        SET quantity = ${qty}, updated_at = NOW()
        WHERE variant_id IN (SELECT id FROM product_variants WHERE sku = ${body.sku.toUpperCase()});
      `;
    }

    if (body.name && body.id) {
      await sql`
        UPDATE products 
        SET name = ${body.name}, updated_at = NOW()
        WHERE id = ${body.id};
      `;
    }

    return NextResponse.json({ success: true, message: 'Product updated in Neon database' });
  } catch (err: any) {
    console.error('Error updating product in Neon DB:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const sku = searchParams.get('sku');
    const sql = getDb();

    if (id) {
      await sql`UPDATE products SET deleted_at = NOW() WHERE id = ${id};`;
    } else if (sku) {
      await sql`
        UPDATE products SET deleted_at = NOW() 
        WHERE id IN (SELECT product_id FROM product_variants WHERE sku = ${sku.toUpperCase()});
      `;
    }

    return NextResponse.json({ success: true, message: 'Product soft-deleted from Neon database' });
  } catch (err: any) {
    console.error('Error deleting product in Neon DB:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
