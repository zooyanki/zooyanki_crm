'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { AddChannelButton } from '@/features/catalog/add-channel-modal';
import {
  useCatalog,
  type CatalogItem,
  type ListingStatus,
} from '@/shared/api/hooks';
import { formatPrice } from '@/shared/lib/format';
import { CHANNEL_LABEL, LISTING_STATUS_LABEL } from '@/shared/lib/labels';
import { ChannelBadges } from '@/shared/ui/channel-badges';

const PER_PAGE = 20;

export function CatalogTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, isFetching } = useCatalog({
    page,
    perPage: PER_PAGE,
    status: 'ACTIVE',
  });

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.perPage));
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              Активные объявления
            </h2>
            <p className="text-sm text-zinc-500">
              {data ? `${data.total} товаров` : 'Загрузка…'}
              {isFetching && !isLoading ? ' · обновляем' : ''}
              . Один товар — одна строка, площадки в колонке справа.
            </p>
          </div>
          <Link
            href="/listings/new"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Новое объявление
          </Link>
        </div>

        {isLoading ? (
          <p className="px-5 py-16 text-center text-sm text-zinc-500">Загружаем каталог…</p>
        ) : isError ? (
          <p className="px-5 py-16 text-center text-sm text-red-600">
            Не удалось загрузить каталог: {error.message}
          </p>
        ) : !data || data.items.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-zinc-500">
            Активных товаров нет. Подключите площадку и синхронизируйте объявления или нажмите
            «Новое объявление».
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Товар</th>
                    <th className="px-5 py-3 font-medium">Площадки</th>
                    <th className="px-5 py-3 font-medium">Цена</th>
                    <th className="px-5 py-3 font-medium">
                      <span className="sr-only">Добавить площадку</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <CatalogRow key={item.variantId} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
            {data.total > PER_PAGE ? (
              <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-sm">
                <span className="text-zinc-500">
                  Стр. {page} из {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((value) => value + 1)}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
                  >
                    Вперёд
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function CatalogRow({ item }: { item: CatalogItem }) {
  return (
    <tr className="align-top border-t border-zinc-100 hover:bg-zinc-50/70">
      <td className="px-5 py-3">
        <div className="font-medium text-zinc-900">{item.title}</div>
        <div className="text-xs text-zinc-400">{item.sku}</div>
      </td>
      <td className="px-5 py-3">
        <ChannelBadges
          channels={uniqueChannels(item).map((publication) => ({
            channel: publication.channel,
            active: publication.status === 'ACTIVE',
          }))}
        />
        <ul className="mt-2 space-y-0.5 text-xs text-zinc-400">
          {item.publications.map((publication) => (
            <li key={publication.listingId}>
              {CHANNEL_LABEL[publication.channel] ?? publication.channel}:{' '}
              {LISTING_STATUS_LABEL[publication.status as ListingStatus] ?? publication.status}
              {publication.url ? (
                <>
                  {' '}
                  ·{' '}
                  <a
                    href={publication.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-800 hover:underline"
                  >
                    открыть
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </td>
      <td className="px-5 py-3 tabular-nums text-zinc-800">
        {item.price != null ? formatPrice(item.price, item.currency) : '—'}
      </td>
      <td className="px-5 py-3">
        <AddChannelButton item={item} />
      </td>
    </tr>
  );
}

function uniqueChannels(item: CatalogItem) {
  const seen = new Set<string>();
  return item.publications.filter((publication) => {
    if (seen.has(publication.channel)) return false;
    seen.add(publication.channel);
    return true;
  });
}
