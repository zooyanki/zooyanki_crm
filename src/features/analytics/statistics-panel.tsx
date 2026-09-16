'use client';

import { useMemo, useState } from 'react';

import { MetricsChart } from '@/features/analytics/metrics-chart';
import { useChannelAccounts } from '@/shared/api/hooks';
import { CHANNEL_LABEL } from '@/shared/lib/labels';
import { ChannelIcon } from '@/shared/ui/channel-badges';
import { cn } from '@/shared/lib/utils';

export function StatisticsPanel() {
  const accounts = useChannelAccounts();
  const active = useMemo(
    () => (accounts.data ?? []).filter((item) => item.status === 'ACTIVE'),
    [accounts.data],
  );
  const [accountId, setAccountId] = useState<string | null>(null);
  const selected = active.find((item) => item.id === accountId);

  if (accounts.isLoading) {
    return (
      <p className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-16 text-center text-sm text-zinc-500">
        Загружаем площадки…
      </p>
    );
  }

  if (active.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-16 text-center text-sm text-zinc-500">
        Подключите площадку, чтобы увидеть статистику.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
        <h2 className="text-base font-semibold text-zinc-900">Площадка</h2>
        <p className="mt-1 text-sm text-zinc-500">
          График показов, контактов и расходов по выбранному аккаунту.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {active.map((account) => {
            const selectedNow = account.id === accountId;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setAccountId(account.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition',
                  selectedNow
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
                )}
              >
                <ChannelIcon channel={account.channel} />
                {CHANNEL_LABEL[account.channel] ?? account.channel}: {account.title}
              </button>
            );
          })}
        </div>
      </section>

      {selected ? (
        <MetricsChart
          channelAccountId={selected.id}
          subtitle={`${CHANNEL_LABEL[selected.channel] ?? selected.channel}: ${selected.title}`}
        />
      ) : (
        <p className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-16 text-center text-sm text-zinc-500">
          Выберите площадку, чтобы открыть статистику.
        </p>
      )}
    </div>
  );
}
