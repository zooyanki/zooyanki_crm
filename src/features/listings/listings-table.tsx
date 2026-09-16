'use client';

import { useMemo, useState } from 'react';

import {
  useApplyVas,
  useListingVas,
  useListings,
  useUpdateListingPrice,
  type ListingStatus,
  type ListingView,
} from '@/shared/api/hooks';
import { formatDateTime, formatPrice } from '@/shared/lib/format';
import { CHANNEL_LABEL, LISTING_STATUS_LABEL, VAS_SLUG_LABEL } from '@/shared/lib/labels';
import { cn } from '@/shared/lib/utils';

const STATUS_FILTERS: Array<{ value?: ListingStatus; label: string }> = [
  { label: 'Все' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'OLD', label: 'Снятые' },
  { value: 'BLOCKED', label: 'Заблокированные' },
  { value: 'REJECTED', label: 'Отклонённые' },
];

const PER_PAGE = 20;

export function ListingsTable() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ListingStatus | undefined>(undefined);

  const { data, isLoading, isError, error, isFetching } = useListings({
    page,
    perPage: PER_PAGE,
    status,
  });

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.perPage));
  }, [data]);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Объявления</h2>
          <p className="text-sm text-zinc-500">
            {data ? `${data.total} в каталоге` : 'Загрузка…'}
            {isFetching && !isLoading ? ' · обновляем' : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const active = status === filter.value;
            return (
              <button
                key={filter.label}
                type="button"
                onClick={() => {
                  setStatus(filter.value);
                  setPage(1);
                }}
                className={cn(
                  'rounded-full px-3 py-1.5 text-sm transition',
                  active
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <p className="px-5 py-16 text-center text-sm text-zinc-500">Загружаем объявления…</p>
      ) : isError ? (
        <p className="px-5 py-16 text-center text-sm text-red-600">
          Не удалось загрузить список: {error.message}
        </p>
      ) : !data || data.items.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-zinc-500">Объявлений пока нет</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Объявление</th>
                  <th className="px-5 py-3 font-medium">Площадка</th>
                  <th className="px-5 py-3 font-medium">Статус</th>
                  <th className="px-5 py-3 font-medium">Цена</th>
                  <th className="px-5 py-3 font-medium">Синхронизация</th>
                  <th className="px-5 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <ListingRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-sm">
            <span className="text-zinc-500">
              Страница {page} из {totalPages}
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
        </>
      )}
    </section>
  );
}

function ListingRow({ item }: { item: ListingView }) {
  const updatePrice = useUpdateListingPrice();
  const applyVas = useApplyVas();
  const [priceDraft, setPriceDraft] = useState(
    item.price !== null && item.price !== undefined ? String(item.price) : '',
  );
  const [showVas, setShowVas] = useState(false);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [selectedStickers, setSelectedStickers] = useState<number[]>([]);

  const vas = useListingVas(item.id, showVas);

  const busy = updatePrice.isPending || applyVas.isPending;
  const priceValue = Number.parseFloat(priceDraft);
  const priceChanged =
    Number.isFinite(priceValue) &&
    priceValue >= 0 &&
    priceValue !== (item.price ?? NaN);

  return (
    <tr className="align-top border-t border-zinc-100 hover:bg-zinc-50/70">
      <td className="px-5 py-3">
        <div className="max-w-md">
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-zinc-900 hover:text-teal-800 hover:underline"
            >
              {item.title ?? `Объявление ${item.externalId}`}
            </a>
          ) : (
            <span className="font-medium text-zinc-900">
              {item.title ?? `Объявление ${item.externalId}`}
            </span>
          )}
          <div className="mt-0.5 text-xs text-zinc-400">#{item.externalId}</div>
        </div>
      </td>
      <td className="px-5 py-3 text-zinc-600">{CHANNEL_LABEL[item.channel] ?? item.channel}</td>
      <td className="px-5 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-5 py-3">
        <form
          className="flex items-center gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!priceChanged) return;
            updatePrice.mutate({
              listingId: item.id,
              body: { price: priceValue },
            });
          }}
        >
          <input
            type="number"
            min={0}
            step={1}
            value={priceDraft}
            onChange={(event) => setPriceDraft(event.target.value)}
            disabled={busy}
            className="w-24 rounded-lg border border-zinc-200 px-2 py-1 text-xs tabular-nums"
          />
          <button
            type="submit"
            disabled={busy || !priceChanged}
            className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-40"
          >
            OK
          </button>
        </form>
        {updatePrice.isError ? (
          <p className="mt-1 text-xs text-red-600">{updatePrice.error.message}</p>
        ) : null}
        {updatePrice.isSuccess ? (
          <p className="mt-1 text-xs text-teal-700">Цена в очереди</p>
        ) : null}
      </td>
      <td className="px-5 py-3 text-zinc-500">{formatDateTime(item.syncedAt)}</td>
      <td className="px-5 py-3">
        <div className="flex min-w-[180px] flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setShowVas((value) => !value);
              setSelectedSlugs([]);
              setSelectedStickers([]);
            }}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            Продвижение
          </button>

          {showVas ? (
            <div className="flex flex-col gap-1.5">
              {vas.isLoading ? (
                <p className="text-xs text-zinc-500">Загружаем услуги…</p>
              ) : null}
              {vas.isError ? (
                <p className="text-xs text-red-600">{vas.error.message}</p>
              ) : null}
              {(vas.data?.vas ?? []).map((offer) => {
                const checked = selectedSlugs.includes(offer.slug);
                return (
                  <label
                    key={offer.slug}
                    className="flex cursor-pointer items-start gap-1.5 text-xs text-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedSlugs((prev) =>
                          checked
                            ? prev.filter((slug) => slug !== offer.slug)
                            : [...prev, offer.slug],
                        );
                      }}
                      className="mt-0.5"
                    />
                    <span>
                      {VAS_SLUG_LABEL[offer.slug] ?? offer.slug}
                      <span className="text-zinc-400">
                        {' '}
                        · {formatPrice(offer.price, item.currency)}
                        {offer.priceOld ? (
                          <span className="ml-1 line-through">
                            {formatPrice(offer.priceOld, item.currency)}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </label>
                );
              })}
              {(vas.data?.stickers ?? []).length > 0 ? (
                <div className="mt-1 flex flex-col gap-1 border-t border-zinc-100 pt-1.5">
                  <span className="text-[11px] text-zinc-500">Стикеры</span>
                  {vas.data!.stickers.map((sticker) => {
                    const checked = selectedStickers.includes(sticker.id);
                    return (
                      <label
                        key={sticker.id}
                        className="flex cursor-pointer items-start gap-1.5 text-xs text-zinc-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedStickers((prev) =>
                              checked
                                ? prev.filter((id) => id !== sticker.id)
                                : [...prev, sticker.id],
                            );
                          }}
                          className="mt-0.5"
                        />
                        <span>{sticker.title ?? `Стикер #${sticker.id}`}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}
              <button
                type="button"
                disabled={busy || selectedSlugs.length === 0}
                onClick={() => {
                  applyVas.mutate({
                    listingId: item.id,
                    body: {
                      slugs: selectedSlugs,
                      ...(selectedStickers.length > 0
                        ? { stickers: selectedStickers }
                        : {}),
                    },
                  });
                  setShowVas(false);
                  setSelectedSlugs([]);
                  setSelectedStickers([]);
                }}
                className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-40"
              >
                Применить
              </button>
              {applyVas.isError ? (
                <p className="text-xs text-red-600">{applyVas.error.message}</p>
              ) : null}
              {applyVas.isSuccess ? (
                <p className="text-xs text-teal-700">VAS в очереди</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: ListingStatus }) {
  const tone =
    status === 'ACTIVE'
      ? 'bg-teal-50 text-teal-800'
      : status === 'OLD'
        ? 'bg-zinc-100 text-zinc-600'
        : status === 'BLOCKED' || status === 'REJECTED'
          ? 'bg-amber-50 text-amber-800'
          : 'bg-zinc-100 text-zinc-600';

  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', tone)}>
      {LISTING_STATUS_LABEL[status]}
    </span>
  );
}
