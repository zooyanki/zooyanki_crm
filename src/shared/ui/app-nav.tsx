'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/shared/lib/utils';

const LINKS = [
  { href: '/', label: 'Объявления' },
  { href: '/statistics', label: 'Статистика' },
  { href: '/orders', label: 'Заказы' },
  { href: '/inventory', label: 'Склад' },
  { href: '/messages', label: 'Сообщения' },
  { href: '/wallet', label: 'Кошелёк' },
  { href: '/autoload', label: 'Автозагрузка' },
  { href: '/reviews', label: 'Отзывы' },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1">
      {LINKS.map((link) => {
        const active =
          link.href === '/'
            ? pathname === '/' || pathname.startsWith('/listings')
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'rounded-xl px-3 py-1.5 text-sm transition',
              active
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
