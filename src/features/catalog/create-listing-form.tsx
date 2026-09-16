'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  useChannelAccounts,
  useChannelsCatalog,
  useCreateCatalogItem,
} from '@/shared/api/hooks';
import { cn } from '@/shared/lib/utils';
import { ChannelIcon } from '@/shared/ui/channel-badges';

export function CreateListingForm() {
  const router = useRouter();
  const catalog = useChannelsCatalog();
  const accounts = useChannelAccounts();
  const create = useCreateCatalogItem();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [accountIds, setAccountIds] = useState<string[]>([]);

  const activeAccounts = (accounts.data ?? []).filter((account) => account.status === 'ACTIVE');
  const platforms = catalog.data?.items ?? [];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedPrice = Number(price.replace(',', '.'));
    if (
      !title.trim() ||
      !description.trim() ||
      !Number.isFinite(parsedPrice) ||
      accountIds.length === 0
    ) {
      return;
    }
    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        channelAccountIds: accountIds,
        ...(sku.trim() ? { sku: sku.trim() } : {}),
      },
      {
        onSuccess: () => {
          router.push('/');
        },
      },
    );
  };

  const toggleAccount = (accountId: string) => {
    setAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    );
  };

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-5 shadow-sm backdrop-blur">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Новое объявление</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Сначала карточка товара, затем площадки, на которых разместить.
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-zinc-600">Название</span>
          <input
            value={title}
            maxLength={50}
            onChange={(event) => setTitle(event.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-zinc-600">Описание</span>
          <textarea
            value={description}
            maxLength={7500}
            rows={6}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Цена, ₽</span>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 tabular-nums"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">SKU (необязательно)</span>
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2"
          />
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-zinc-800">Площадки размещения</legend>
          <p className="mt-1 text-sm text-zinc-500">
            Отметьте, куда выложить это объявление. Можно выбрать несколько.
          </p>
          {catalog.isLoading || accounts.isLoading ? (
            <p className="mt-3 text-sm text-zinc-500">Загружаем площадки…</p>
          ) : platforms.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Сначала подключите площадку.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {platforms.map((item) => {
                const account = activeAccounts.find((entry) => entry.channel === item.code);
                const checked = Boolean(account && accountIds.includes(account.id));
                const disabled = !account;
                return (
                  <label
                    key={item.code}
                    className={cn(
                      'rounded-xl border px-3 py-3 text-sm transition',
                      disabled
                        ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400'
                        : checked
                          ? 'cursor-pointer border-zinc-900 bg-zinc-900 text-white'
                          : 'cursor-pointer border-zinc-200 bg-white hover:bg-zinc-50',
                    )}
                  >
                    <span className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {
                          if (!account) return;
                          toggleAccount(account.id);
                        }}
                      />
                      <span>
                        <span className="flex items-center gap-2 font-medium">
                          <ChannelIcon channel={item.code} />
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            'mt-1 block text-xs',
                            disabled
                              ? 'text-zinc-400'
                              : checked
                                ? 'text-zinc-300'
                                : 'text-zinc-500',
                          )}
                        >
                          {account
                            ? account.title
                            : item.connectable
                              ? 'Не подключена'
                              : 'Скоро'}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={create.isPending || accountIds.length === 0}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            {create.isPending ? 'Сохраняем…' : 'Разместить'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Отмена
          </button>
        </div>
      </form>
      {create.isError ? <p className="mt-3 text-sm text-red-600">{create.error.message}</p> : null}
    </section>
  );
}
