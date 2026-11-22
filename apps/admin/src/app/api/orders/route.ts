import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(process.cwd(), '../../data/orders.json');

function getOrdersFilePath(): string {
  if (fs.existsSync(DATA_FILE)) return DATA_FILE;
  const rootPath = path.resolve(process.cwd(), '../data/orders.json');
  if (fs.existsSync(rootPath)) return rootPath;
  const projectRoot = '/Users/adityayadav/ecommerce-platform/data/orders.json';
  if (fs.existsSync(projectRoot)) return projectRoot;
  return DATA_FILE;
}

function readOrders() {
  try {
    const filePath = getOrdersFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading orders:', err);
  }
  return [];
}

function writeOrders(orders: any[]) {
  try {
    const filePath = getOrdersFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders:', err);
  }
}

export async function GET() {
  const orders = readOrders();
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orders = readOrders();

    const newOrder = {
      id: body.id || `ord-${Date.now()}`,
      orderNumber: body.orderNumber || `#${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: body.customerName || 'Aditya Yadav',
      customerEmail: body.customerEmail || 'aditya.customer@apex.local',
      customerPhone: body.customerPhone || '+91 9876543210',
      customerInitials: body.customerInitials || 'AY',
      deliveryType: body.deliveryType || 'Shipping',
      status: body.status || 'PAID',
      date: body.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalMinor: body.totalMinor || 159000,
      productThumb: body.productThumb || (body.items?.[0]?.imageUrl) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80',
      address: body.address || '4517 Washington Ave. Manchester, Kentucky 39495',
      courierName: body.courierName || 'Blue Dart Express',
      trackingNumber: body.trackingNumber || `BLUEDART-${Math.floor(10000000 + Math.random() * 90000000)}`,
      items: body.items || [],
    };

    const updated = [newOrder, ...orders.filter((o: any) => o.id !== newOrder.id)];
    writeOrders(updated);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save order' }, { status: 500 });
  }
}
