import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { WhatsAppWidget } from '@/components/WhatsAppWidget';

export const metadata: Metadata = {
  title: {
    default: 'Doctor-Guided GLP-1 Weight Loss Treatment | DrGodly',
    template: '%s | DrGodly',
  },
  description: 'Personalized, doctor-guided GLP-1 weight loss care with eligibility screening, treatment plans, and ongoing support from DrGodly.',
  openGraph: {
    siteName: 'DrGodly',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/Before-After1.png',
        width: 2816,
        height: 1536,
        alt: 'Before and after weight-loss progress example',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/drgodly-mark.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/drgodly-mark.svg',
    apple: '/drgodly-mark.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts: Outfit for Headlines, Inter for Body */}
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols Outlined for CRM icons */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden antialiased bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <WhatsAppWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
