'use client';

import { useState } from 'react';

import {
  useChannelAccounts,
  useChannelsCatalog,
  useConnectChannelAccount,
} from '@/shared/api/hooks';
import { CHANNEL_LABEL } from '@/shared/lib/labels';
import { ChannelIcon } from '@/shared/ui/channel-badges';
import { cn } from '@/shared/lib/utils';

export function ChannelsSetup() {
  const catalog = useChannelsCatalog();
  const accounts = useChannelAccounts();
  const connect = useConnectChannelAccount();
  const [channel, setChannel] = useState('AVITO');
  const [title, setTitle] = useState('Авито');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const items = catalog.data?.items ?? [];
  const selected = items.find((item) => item.code === channel);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected?.connectable) return;
    connect.mutate({
      channel: selected.code,
      title: title.trim() || selected.title,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Подключите площадку</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Для Авито нужны client_id и client_secret из кабинета API, не логин с паролем.
      </p>

      {catalog.isLoading ? (
        <p className="mt-4 text-sm text-zinc-500">Загружаем список площадок…</p>
      ) : catalog.isError ? (
        <p className="mt-4 text-sm text-red-600">{catalog.error.message}</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const connected = (accounts.data ?? []).some(
              (account) => account.channel === item.code && account.status === 'ACTIVE',
            );
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setChannel(item.code);
                  setTitle(item.title);
                }}
                className={cn(
                  'rounded-xl border px-3 py-3 text-left text-sm transition',
                  channel === item.code
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50',
                )}
              >
                <div className="flex items-center gap-2 font-medium">
                  <ChannelIcon channel={item.code} />
                  {item.title}
                </div>
                <div
                  className={cn(
                    'mt-1 text-xs',
                    channel === item.code ? 'text-zinc-300' : 'text-zinc-500',
                  )}
                >
                  {connected
                    ? 'Подключена'
                    : item.connectable
                      ? 'Можно подключить'
                      : 'Скоро'}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected ? (
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
          <p className="text-sm text-zinc-600">{selected.authHint}</p>
          {selected.connectable ? (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600">Название подключения</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="rounded-xl border border-zinc-200 px-3 py-2"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600">Client ID</span>
                <input
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  className="rounded-xl border border-zinc-200 px-3 py-2"
                  autoComplete="off"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600">Client secret</span>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(event) => setClientSecret(event.target.value)}
                  className="rounded-xl border border-zinc-200 px-3 py-2"
                  autoComplete="off"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={connect.isPending}
                className="self-start rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
              >
                {connect.isPending ? 'Проверяем ключи…' : `Подключить ${selected.title}`}
              </button>
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              {CHANNEL_LABEL[selected.code] ?? selected.title}: адаптер ещё не готов, ключи
              принять нельзя.
            </p>
          )}
          {connect.isError ? (
            <p className="text-sm text-red-600">{connect.error.message}</p>
          ) : null}
          {connect.isSuccess ? (
            <p className="text-sm text-teal-700">Площадка подключена.</p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
