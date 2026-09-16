'use client';

import { useMemo, useState } from 'react';

import {
  useChannelAccounts,
  useWalletBalance,
  useWalletOperations,
} from '@/shared/api/hooks';
import { formatDateTime, formatPrice } from '@/shared/lib/format';
import { CHANNEL_LABEL } from '@/shared/lib/labels';

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDayIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

function endOfDayIso(dateStr: string): string {
  return new Date(`${dateStr}T23:59:59.999`).toISOString();
}

export function WalletPanel() {
  const accounts = useChannelAccounts();
  const avitoAccounts = useMemo(
    () => (accounts.data ?? []).filter((account) => account.channel === 'AVITO'),
    [accounts.data],
  );

  const [channelAccountId, setChannelAccountId] = useState('');
  const selectedAccountId = channelAccountId || avitoAccounts[0]?.id || '';

  const today = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    return date;
  }, []);

  const [dateFrom, setDateFrom] = useState(toDateInputValue(weekAgo));
  const [dateTo, setDateTo] = useState(toDateInputValue(today));

  const balance = useWalletBalance(selectedAccountId, Boolean(selectedAccountId));
  const operations = useWalletOperations(
    {
      channelAccountId: selectedAccountId,
      dateFrom: startOfDayIso(dateFrom),
      dateTo: endOfDayIso(dateTo),
    },
    Boolean(selectedAccountId && dateFrom && dateTo),
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200/80 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
        <h2 className="text-base font-semibold text-zinc-900">Параметры</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Баланс и операции кошелька Авито. История — не более 7 дней.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-sm">
            <span className="text-zinc-600">Аккаунт</span>
            <select
              value={selectedAccountId}
              onChange={(event) => setChannelAccountId(event.target.value)}
              disabled={accounts.isLoading}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
            >
              {avitoAccounts.length === 0 ? (
                <option value="">Нет аккаунтов Авито</option>
              ) : (
                avitoAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.title} · {CHANNEL_LABEL[account.channel] ?? account.channel}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">С</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600">По</span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Баланс</h2>
        {!selectedAccountId ? (
          <p className="mt-3 text-sm text-zinc-500">Подключите аккаунт Авито.</p>
        ) : balance.isLoading ? (
          <p className="mt-3 text-sm text-zinc-500">Загружаем баланс…</p>
        ) : balance.isError ? (
          <p className="mt-3 text-sm text-red-600">{balance.error.message}</p>
        ) : balance.data ? (
          <div className="mt-4 flex flex-wrap gap-6">
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">Реальные</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">
                {formatPrice(balance.data.real)}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">Бонусы</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-teal-800">
                {formatPrice(balance.data.bonus)}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Операции</h2>
          <p className="text-sm text-zinc-500">
            {operations.data ? `${operations.data.items.length} записей` : 'Загрузка…'}
          </p>
        </div>

        {!selectedAccountId ? (
          <p className="px-5 py-16 text-center text-sm text-zinc-500">Выберите аккаунт</p>
        ) : operations.isLoading ? (
          <p className="px-5 py-16 text-center text-sm text-zinc-500">Загружаем операции…</p>
        ) : operations.isError ? (
          <p className="px-5 py-16 text-center text-sm text-red-600">
            {operations.error.message}
          </p>
        ) : !operations.data || operations.data.items.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-zinc-500">Операций за период нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Дата</th>
                  <th className="px-5 py-3 font-medium">Операция</th>
                  <th className="px-5 py-3 font-medium">Услуга</th>
                  <th className="px-5 py-3 font-medium">Сумма</th>
                  <th className="px-5 py-3 font-medium">Объявление</th>
                </tr>
              </thead>
              <tbody>
                {operations.data.items.map((item, index) => (
                  <tr
                    key={`${item.updatedAt}-${item.operationType}-${index}`}
                    className="border-t border-zinc-100 hover:bg-zinc-50/70"
                  >
                    <td className="px-5 py-3 text-zinc-600">
                      {formatDateTime(item.updatedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-zinc-900">{item.operationName}</div>
                      <div className="text-xs text-zinc-400">{item.operationType}</div>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {item.serviceName ?? '—'}
                      {item.serviceType ? (
                        <div className="text-xs text-zinc-400">{item.serviceType}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      <div className="font-medium text-zinc-900">
                        {formatPrice(item.amountTotal)}
                      </div>
                      <div className="text-xs text-zinc-400">
                        ₽ {item.amountRub} · бонус {item.amountBonus}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {item.itemId ? `#${item.itemId}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
