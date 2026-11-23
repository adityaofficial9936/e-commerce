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

    const products = rows.map((r: any) => ({
      ...r,
      finish: r.variant || '18k Gold-Tone',
      material: r.description || 'Hypoallergenic 316L Stainless Steel',
      inStock: (r.quantityOnHand || 0) > 0,
      rating: 4.9,
      reviewsCount: 88,
      images: [
        {
          id: `img-${r.id}`,
          url: r.imageUrl,
          altText: r.name,
          isPrimary: true,
        },
      ],
    }));

    return NextResponse.json(products);
  } catch (err: any) {
    console.error('Database query error in storefront /api/products GET:', err);
    return NextResponse.json([], { status: 500 });
  }
}
