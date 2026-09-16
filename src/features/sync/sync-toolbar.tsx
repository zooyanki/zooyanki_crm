'use client';

import { RefreshCw } from 'lucide-react';

import { useChannelAccounts, useSubscribeWebhook, useTriggerSync, type SyncEntity } from '@/shared/api/hooks';
import { formatDateTime } from '@/shared/lib/format';
import { CHANNEL_LABEL } from '@/shared/lib/labels';
import { cn } from '@/shared/lib/utils';

export function SyncToolbar({
  showOrders = false,
  showChats = false,
  showReviews = false,
  showStocks = false,
}: {
  showOrders?: boolean;
  showChats?: boolean;
  showReviews?: boolean;
  showStocks?: boolean;
}) {
  const accounts = useChannelAccounts();
  const sync = useTriggerSync();
  const webhook = useSubscribeWebhook();

  const account = accounts.data?.find((item) => item.channel === 'AVITO' && item.status === 'ACTIVE');

  const run = (entity: SyncEntity) => {
    if (!account) return;
    sync.mutate({
      channelAccountId: account.id,
      channel: account.channel,
      entity,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
      <div>
        <div className="text-sm font-medium text-zinc-900">
          {account
            ? `${CHANNEL_LABEL[account.channel] ?? account.channel}: ${account.title}`
            : 'Аккаунт Авито не подключён'}
        </div>
        <div className="text-xs text-zinc-500">
          {account
            ? `Последняя синхронизация: ${formatDateTime(account.lastSyncAt)}`
            : 'Подключите аккаунт через API бэкенда'}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {showStocks ? (
          <button
            type="button"
            disabled={!account || sync.isPending}
            onClick={() => run('stocks')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40',
            )}
          >
            <RefreshCw className={cn('h-4 w-4', sync.isPending && 'animate-spin')} />
            Обновить остатки
          </button>
        ) : showReviews ? (
          <button
            type="button"
            disabled={!account || sync.isPending}
            onClick={() => run('reviews')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40',
            )}
          >
            <RefreshCw className={cn('h-4 w-4', sync.isPending && 'animate-spin')} />
            Обновить отзывы
          </button>
        ) : showChats ? (
          <>
            <button
              type="button"
              disabled={!account || sync.isPending}
              onClick={() => run('chats')}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40',
              )}
            >
              <RefreshCw className={cn('h-4 w-4', sync.isPending && 'animate-spin')} />
              Обновить чаты
            </button>
            <button
              type="button"
              disabled={!account || webhook.isPending}
              onClick={() => {
                if (!account) return;
                webhook.mutate({ channelAccountId: account.id });
              }}
              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
            >
              Подключить вебхук
            </button>
          </>
        ) : showOrders ? (
          <button
            type="button"
            disabled={!account || sync.isPending}
            onClick={() => run('orders')}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40',
            )}
          >
            <RefreshCw className={cn('h-4 w-4', sync.isPending && 'animate-spin')} />
            Обновить заказы
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={!account || sync.isPending}
              onClick={() => run('listings')}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40',
              )}
            >
              <RefreshCw className={cn('h-4 w-4', sync.isPending && 'animate-spin')} />
              Обновить объявления
            </button>
            <button
              type="button"
              disabled={!account || sync.isPending}
              onClick={() => run('stats')}
              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
            >
              Обновить статистику
            </button>
          </>
        )}
      </div>

      {sync.isError ? (
        <p className="w-full text-sm text-red-600">{sync.error.message}</p>
      ) : null}
      {sync.isSuccess ? (
        <p className="w-full text-sm text-teal-700">Синхронизация поставлена в очередь</p>
      ) : null}
      {webhook.isError ? (
        <p className="w-full text-sm text-red-600">{webhook.error.message}</p>
      ) : null}
      {webhook.isSuccess ? (
        <p className="w-full text-sm text-teal-700">Вебхук: {webhook.data.url}</p>
      ) : null}
    </div>
  );
}
