'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  useAttachListing,
  useChannelAccounts,
  useChannelsCatalog,
  useListings,
  type CatalogItem,
} from '@/shared/api/hooks';
import { CHANNEL_LABEL } from '@/shared/lib/labels';
import { cn } from '@/shared/lib/utils';
import { ChannelIcon } from '@/shared/ui/channel-badges';

const LISTINGS_PER_PAGE = 50;

export function AddChannelButton({ item }: { item: CatalogItem }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
      >
        + Добавить площадку
      </button>
      {open ? <AddChannelModal item={item} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function AddChannelModal({ item, onClose }: { item: CatalogItem; onClose: () => void }) {
  const catalog = useChannelsCatalog();
  const accounts = useChannelAccounts();
  const attach = useAttachListing();
  const [channel, setChannel] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  const presentChannels = useMemo(
    () => new Set<string>(item.publications.map((publication) => publication.channel)),
    [item.publications],
  );
  const ownListingIds = useMemo(
    () => new Set(item.publications.map((publication) => publication.listingId)),
    [item.publications],
  );

  const availableChannels = (catalog.data?.items ?? []).filter(
    (entry) => !presentChannels.has(entry.code),
  );
  const selectedAccount = (accounts.data ?? []).find(
    (account) => account.status === 'ACTIVE' && account.channel === channel,
  );

  const listings = useListings({
    page,
    perPage: LISTINGS_PER_PAGE,
    status: 'ACTIVE',
    channelAccountId: selectedAccount?.id,
    enabled: Boolean(selectedAccount?.id),
  });

  const visibleListings = (listings.data?.items ?? []).filter((listing) => {
    if (ownListingIds.has(listing.id)) return false;
    if (presentChannels.has(listing.channel)) return false;
    const haystack = `${listing.title ?? ''} ${listing.externalId}`.toLowerCase();
    return query.trim() === '' || haystack.includes(query.trim().toLowerCase());
  });

  const totalPages = Math.max(
    1,
    Math.ceil((listings.data?.total ?? 0) / (listings.data?.perPage ?? LISTINGS_PER_PAGE)),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!mounted) return null;

  const selectedChannel = availableChannels.find((entry) => entry.code === channel);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-channel-title"
        className="relative z-10 flex max-h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4">
          <div>
            <h2 id="add-channel-title" className="text-lg font-semibold text-zinc-900">
              Добавить площадку
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              К «{item.title}». Сначала площадка, затем объявление с неё.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          >
            Закрыть
          </button>
        </header>

        <div className="grid min-h-[420px] flex-1 grid-cols-1 overflow-hidden md:grid-cols-[220px_1fr]">
          <aside className="border-b border-zinc-100 md:border-b-0 md:border-r">
            <div className="border-b border-zinc-100 px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Площадка
            </div>
            {catalog.isLoading || accounts.isLoading ? (
              <p className="px-4 py-6 text-sm text-zinc-500">Загружаем площадки…</p>
            ) : availableChannels.length === 0 ? (
              <p className="px-4 py-6 text-sm text-zinc-500">
                Этот товар уже есть на всех доступных площадках.
              </p>
            ) : (
              <ul className="p-2">
                {availableChannels.map((entry) => {
                  const selectedNow = entry.code === channel;
                  return (
                    <li key={entry.code}>
                      <button
                        type="button"
                        onClick={() => {
                          setChannel(entry.code);
                          setPage(1);
                          setQuery('');
                          attach.reset();
                        }}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition',
                          selectedNow
                            ? 'bg-zinc-900 text-white'
                            : 'text-zinc-700 hover:bg-zinc-50',
                        )}
                      >
                        <ChannelIcon channel={entry.code} />
                        {entry.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {selectedChannel ? `Товары · ${selectedChannel.title}` : 'Товары'}
              </div>
              {channel ? (
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Поиск"
                  className="w-48 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                />
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {!channel ? (
                <p className="px-4 py-16 text-center text-sm text-zinc-500">
                  Выберите площадку слева — здесь появится её список товаров.
                </p>
              ) : !selectedAccount ? (
                <p className="px-4 py-16 text-center text-sm text-zinc-500">
                  Эта площадка ещё не подключена. Сначала добавьте её аккаунт.
                </p>
              ) : listings.isLoading ? (
                <p className="px-4 py-16 text-center text-sm text-zinc-500">Загружаем товары…</p>
              ) : listings.isError ? (
                <p className="px-4 py-16 text-center text-sm text-red-600">{listings.error.message}</p>
              ) : visibleListings.length === 0 ? (
                <p className="px-4 py-16 text-center text-sm text-zinc-500">
                  На этой площадке нет объявлений, которые можно присвоить.
                </p>
              ) : (
                <ul>
                  {visibleListings.map((listing) => (
                    <li key={listing.id} className="border-b border-zinc-100 last:border-b-0">
                      <button
                        type="button"
                        disabled={attach.isPending}
                        onClick={() => {
                          attach.mutate(
                            { listingId: listing.id, variantId: item.variantId },
                            { onSuccess: onClose },
                          );
                        }}
                        className="flex w-full items-start justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-zinc-50 disabled:opacity-50"
                      >
                        <span className="text-zinc-800">
                          {listing.title ?? `Объявление ${listing.externalId}`}
                          <span className="text-zinc-400"> ({listing.externalId})</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {channel && selectedAccount && totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2 text-sm">
                <span className="text-zinc-500">
                  Стр. {page} из {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="rounded-lg border border-zinc-200 px-2 py-1 disabled:opacity-40"
                  >
                    Назад
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((value) => value + 1)}
                    className="rounded-lg border border-zinc-200 px-2 py-1 disabled:opacity-40"
                  >
                    Вперёд
                  </button>
                </div>
              </div>
            ) : null}

            {attach.isPending ? (
              <p className="border-t border-zinc-100 px-4 py-2 text-sm text-zinc-500">
                Присваиваем…
              </p>
            ) : null}
            {attach.isError ? (
              <p className="border-t border-zinc-100 px-4 py-2 text-sm text-red-600">
                {attach.error.message}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
