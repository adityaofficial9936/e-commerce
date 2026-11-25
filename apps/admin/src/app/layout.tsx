import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { StaffAuthProvider } from '../context/StaffAuthContext';

export const metadata: Metadata = {
  title: 'Apex Back-Office Operations Console',
  description: 'Operations, catalog, inventory, order fulfillment, and refund management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden flex bg-slate-950 text-slate-100 font-sans antialiased">
        <StaffAuthProvider>
          <AdminSidebar />
          <div className="flex-1 min-w-0 bg-slate-100 text-slate-900 h-screen overflow-y-auto">
            {children}
          </div>
        </StaffAuthProvider>
      </body>
    </html>
  );
}
