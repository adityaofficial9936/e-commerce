import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { CartDrawer } from '../components/cart/CartDrawer';
import { AiChatWidget } from '../components/chat/AiChatWidget';
import { WhatsAppButton } from '../components/common/WhatsAppButton';

export const metadata: Metadata = {
  title: 'Moonlet | Everyday Luxury Jewelry & Timepieces',
  description:
    'Discover affordable luxury fashion jewelry: 18k gold-plated earrings, layered chains, minimalist watches, and stackable rings designed for young women in India. Cash on Delivery available.',
  openGraph: {
    title: 'Moonlet | Everyday Luxury Jewelry',
    description: 'Affordable, skin-friendly gold-tone jewelry for modern daily radiance.',
    siteName: 'Moonlet',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-ivory text-charcoal font-sans antialiased selection:bg-champagne selection:text-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <AiChatWidget />
        <WhatsAppButton />
      </body>
    </html>
  );
}
