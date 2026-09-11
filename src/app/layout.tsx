import type { Metadata } from 'next';
import { Manrope, Source_Serif_4 } from 'next/font/google';

import { Providers } from '@/shared/providers';

import './globals.css';

const sans = Manrope({
  variable: '--font-sans',
  subsets: ['latin', 'cyrillic'],
});

const display = Source_Serif_4({
  variable: '--font-display',
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: 'Zooyanki CRM',
  description: 'Управление продажами на Avito, Ozon, Wildberries и Drom',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full bg-[radial-gradient(circle_at_top_left,#ecfdf5,transparent_35%),radial-gradient(circle_at_top_right,#fff7ed,transparent_30%),linear-gradient(180deg,#fafaf9_0%,#f4f4f5_100%)] text-zinc-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
