'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  useAdjustInventory,
  useInventory,
  useInventoryByListing,
  useListings,
  type InventoryView,
} from '@/shared/api/hooks';
import { formatDateTime } from '@/shared/lib/format';
import { CHANNEL_LABEL } from '@/shared/lib/labels';
import { cn } from '@/shared/lib/utils';

const PER_PAGE = 20;

export function InventoryPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, isFetching } = useInventory({ page, perPage: PER_PAGE });

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.perPage));
  }, [data]);

  return (
    <div className="flex flex-col gap-6">
      <AdjustStockForm />

      <section className="rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Остатки</h2>
          <p className="text-sm text-zinc-500">
            {data ? `${data.total} позиций` : 'Загрузка…'}
            {isFetching && !isLoading ? ' · обновляем' : ''}
          </p>
        </div>

        {isLoading ? (
          <p className="px-5 py-16 text-center text-sm text-zinc-500">Загружаем остатки…</p>
        ) : isError ? (
          <p className="px-5 py-16 text-center text-sm text-red-600">
            Не удалось загрузить склад: {error.message}
          </p>
        ) : !data || data.items.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-zinc-500">
            Остатков пока нет. Нажмите «Обновить остатки» или задайте количество вручную
            (нужна Авито Доставка).
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Товар</th>
                    <th className="px-5 py-3 font-medium">Объявление</th>
                    <th className="px-5 py-3 font-medium">На складе</th>
                    <th className="px-5 py-3 font-medium">Резерв</th>
                    <th className="px-5 py-3 font-medium">Доступно</th>
                    <th className="px-5 py-3 font-medium">Обновлено</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <InventoryRow key={item.id} item={item} />
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
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

function InventoryRow({ item }: { item: InventoryView }) {
  return (
    <tr className="border-t border-zinc-100 hover:bg-zinc-50/70">
      <td className="px-5 py-3">
        <div className="font-medium text-zinc-900">{item.title ?? item.sku}</div>
        <div className="text-xs text-zinc-400">{item.sku}</div>
      </td>
      <td className="px-5 py-3 text-zinc-600">
        {item.listingExternalId ? (
          <>
            <div>{CHANNEL_LABEL[item.channel ?? ''] ?? item.channel ?? '—'}</div>
            <div className="text-xs text-zinc-400">#{item.listingExternalId}</div>
          </>
        ) : (
          '—'
        )}
      </td>
      <td className="px-5 py-3 tabular-nums font-medium text-zinc-900">{item.quantity}</td>
      <td className="px-5 py-3 tabular-nums text-zinc-600">{item.reserved}</td>
      <td className="px-5 py-3 tabular-nums text-teal-800">{item.available}</td>
      <td className="px-5 py-3 text-zinc-500">{formatDateTime(item.updatedAt)}</td>
    </tr>
  );
}

function AdjustStockForm() {
  const listings = useListings({ page: 1, perPage: 100, status: 'ACTIVE' });
  const adjust = useAdjustInventory();
  const [listingId, setListingId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const current = useInventoryByListing(listingId);

  useEffect(() => {
    if (!listingId) {
      setQuantity('1');
      return;
    }
    if (current.data) {
      setQuantity(String(current.data.quantity));
    } else if (!current.isFetching && current.isSuccess) {
      setQuantity('0');
    }
  }, [listingId, current.data, current.isFetching, current.isSuccess]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!listingId) return;

    adjust.mutate({
      listingId,
      quantity: Number.parseInt(quantity, 10),
      pushToChannel: true,
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
      <h2 className="text-base font-semibold text-zinc-900">Установить остаток</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Изменение сохраняется в CRM и ставится в очередь публикации на Авито.
      </p>

      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-sm">
          <span className="text-zinc-600">Объявление</span>
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            disabled={listings.isLoading || adjust.isPending}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
          >
            <option value="">Выберите объявление…</option>
            {(listings.data?.items ?? []).map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listing.title ?? `#${listing.externalId}`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex w-28 flex-col gap-1 text-sm">
          <span className="text-zinc-600">Количество</span>
          <input
            type="number"
            min={0}
            step={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={adjust.isPending}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 tabular-nums"
          />
        </label>

        <button
          type="submit"
          disabled={!listingId || adjust.isPending || listings.isLoading}
          className={cn(
            'rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40',
          )}
        >
          {adjust.isPending ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </form>

      {listingId && current.isFetching ? (
        <p className="mt-3 text-sm text-zinc-500">Загружаем текущий остаток…</p>
      ) : null}
      {listingId && current.data ? (
        <p className="mt-3 text-sm text-zinc-500">
          Сейчас в CRM: {current.data.quantity} (доступно {current.data.available}, резерв{' '}
          {current.data.reserved})
        </p>
      ) : null}
      {listingId && current.isSuccess && !current.data ? (
        <p className="mt-3 text-sm text-zinc-500">
          В CRM остатка ещё нет — подтяните с Авито или задайте вручную.
        </p>
      ) : null}

      {adjust.isError ? (
        <p className="mt-3 text-sm text-red-600">{adjust.error.message}</p>
      ) : null}
      {adjust.isSuccess ? (
        <p className="mt-3 text-sm text-teal-700">
          Остаток обновлён, публикация поставлена в outbox.
        </p>
      ) : null}
    </section>
  );
}
