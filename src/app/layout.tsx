import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DrGodly Telehealth CRM Suite',
  description: 'Premium Medical CRM for DrGodly Weight Loss Telehealth',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Google Fonts: Outfit for Headlines, Inter for Body */}
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols Outlined */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="overflow-hidden font-body-md text-body-md bg-background text-on-surface">
        {children}
      </body>
    </html>
  );
}
