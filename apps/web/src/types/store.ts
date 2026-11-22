export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  priceMinor: number;
  mrpMinor?: number;
  attributes: Record<string, string>;
  availableStock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: { id: string; name: string; slug: string };
  brand?: { id: string; name: string };
  images: { id: string; url: string; isPrimary: boolean }[];
  variants: ProductVariant[];
  basePriceMinor: number;
}

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  variantTitle: string;
  imageUrl: string;
  priceMinor: number;
  quantity: number;
  availableStock: number;
}

export interface OrderTracking {
  orderId: string;
  orderNumber: string;
  status: string;
  totalMinor: number;
  createdAt: string;
  shipment?: {
    courierName: string;
    trackingNumber: string;
    trackingUrl?: string;
    shippedAt: string;
    deliveredAt?: string;
  };
  items: {
    productName: string;
    variantTitle: string;
    quantity: number;
    unitPriceMinor: number;
  }[];
}
