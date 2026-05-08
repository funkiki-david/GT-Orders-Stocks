import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GT Orders & Stocks',
  description: 'Inventory, customer, and sales order front-end MVP',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
