'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Copy, RefreshCw, Upload } from 'lucide-react';

import {
  useAutoloadListings,
  useAutoloadRefreshReport,
  useAutoloadRunItems,
  useAutoloadRuns,
  useAutoloadSettings,
  useAutoloadUpload,
  useChannelAccounts,
  useCreateFeedListing,
  useUpdateAutoloadSettings,
  type AutoloadRun,
  type AutoloadSettings,
  type FeedListing,
} from '@/shared/api/hooks';
import { formatDateTime } from '@/shared/lib/format';
import { AUTOLOAD_RUN_STATUS_LABEL, CHANNEL_LABEL } from '@/shared/lib/labels';
import { cn } from '@/shared/lib/utils';

type SettingsForm = {
  category: string;
  goodsType: string;
  address: string;
  contactPhone: string;
  managerName: string;
  condition: string;
  descriptionFallback: string;
};

function toForm(settings: AutoloadSettings): SettingsForm {
  return {
    category: settings.category,
    goodsType: settings.goodsType ?? '',
    address: settings.address,
    contactPhone: settings.contactPhone ?? '',
    managerName: settings.managerName ?? '',
    condition: settings.condition,
    descriptionFallback: settings.descriptionFallback,
  };
}

function formatMessages(messagesJson: unknown): string {
  if (messagesJson === null || messagesJson === undefined) return '—';
  if (typeof messagesJson === 'string') return messagesJson;
  try {
    return JSON.stringify(messagesJson, null, 2);
  } catch {
    return String(messagesJson);
  }
}

export function AutoloadPanel() {
  const accounts = useChannelAccounts();
  const avitoAccounts = useMemo(
    () => (accounts.data ?? []).filter((account) => account.channel === 'AVITO'),
    [accounts.data],
  );

  const [channelAccountId, setChannelAccountId] = useState('');
  const selectedAccountId = channelAccountId || avitoAccounts[0]?.id || '';

  const settings = useAutoloadSettings(selectedAccountId, Boolean(selectedAccountId));
  const runs = useAutoloadRuns(selectedAccountId, Boolean(selectedAccountId));
  const updateSettings = useUpdateAutoloadSettings();
  const upload = useAutoloadUpload();
  const refreshReport = useAutoloadRefreshReport();

  const [form, setForm] = useState<SettingsForm | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  useEffect(() => {
    if (settings.data) {
      setForm(toForm(settings.data));
    } else {
      setForm(null);
    }
  }, [settings.data]);

  const copyFeedUrl = async () => {
    if (!settings.data?.feedUrl) return;
    try {
      await navigator.clipboard.writeText(settings.data.feedUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const saveSettings = () => {
    if (!selectedAccountId || !form) return;
    updateSettings.mutate({
      channelAccountId: selectedAccountId,
      body: {
        category: form.category,
        goodsType: form.goodsType || null,
        address: form.address,
        contactPhone: form.contactPhone || null,
        managerName: form.managerName || null,
        condition: form.condition,
        descriptionFallback: form.descriptionFallback,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200/80 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
        <h2 className="text-base font-semibold text-zinc-900">Аккаунт</h2>
        <p className="mt-1 text-sm text-zinc-500">
          XML-фид и выгрузки привязаны к аккаунту Авито.
        </p>

        <label className="mt-4 flex min-w-[240px] max-w-md flex-col gap-1 text-sm">
          <span className="text-zinc-600">Аккаунт</span>
          <select
            value={selectedAccountId}
            onChange={(event) => {
              setChannelAccountId(event.target.value);
              setExpandedRunId(null);
            }}
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
      </section>

      {!selectedAccountId ? (
        <p className="rounded-2xl border border-zinc-200/80 bg-white/70 px-5 py-10 text-center text-sm text-zinc-500">
          Подключите аккаунт Авито.
        </p>
      ) : (
        <>
          <section className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">URL фида</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Этот адрес указывается в настройках автозагрузки на Авито.
            </p>

            {settings.isLoading ? (
              <p className="mt-4 text-sm text-zinc-500">Загружаем настройки…</p>
            ) : settings.isError ? (
              <p className="mt-4 text-sm text-red-600">{settings.error.message}</p>
            ) : settings.data ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                  {settings.data.feedUrl}
                </code>
                <button
                  type="button"
                  onClick={() => void copyFeedUrl()}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-teal-700" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Копировать
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </section>

          <CreateFeedListingSection channelAccountId={selectedAccountId} />

          <section className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
                  Настройки фида
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Значения по умолчанию для позиций без своих полей.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!selectedAccountId || upload.isPending}
                  onClick={() => upload.mutate(selectedAccountId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40"
                >
                  <Upload className={cn('h-4 w-4', upload.isPending && 'animate-pulse')} />
                  Выгрузить на Авито
                </button>
                <button
                  type="button"
                  disabled={!selectedAccountId || refreshReport.isPending}
                  onClick={() => refreshReport.mutate(selectedAccountId)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
                >
                  <RefreshCw
                    className={cn('h-4 w-4', refreshReport.isPending && 'animate-spin')}
                  />
                  Обновить отчёт
                </button>
              </div>
            </div>

            {upload.isError ? (
              <p className="mt-3 text-sm text-red-600">{upload.error.message}</p>
            ) : null}
            {upload.isSuccess ? (
              <p className="mt-3 text-sm text-teal-700">
                Выгрузка запущена ·{' '}
                {AUTOLOAD_RUN_STATUS_LABEL[upload.data.status] ?? upload.data.status}
              </p>
            ) : null}
            {refreshReport.isError ? (
              <p className="mt-3 text-sm text-red-600">{refreshReport.error.message}</p>
            ) : null}
            {refreshReport.isSuccess ? (
              <p className="mt-3 text-sm text-teal-700">
                Отчёт обновлён · ок {refreshReport.data.itemsOk} / ошибок{' '}
                {refreshReport.data.itemsError}
              </p>
            ) : null}

            {!form ? (
              settings.isLoading ? null : (
                <p className="mt-4 text-sm text-zinc-500">Нет данных настроек</p>
              )
            ) : (
              <form
                className="mt-4 grid gap-3 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveSettings();
                }}
              >
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-600">Категория</span>
                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, category: event.target.value } : prev))
                    }
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-600">Тип товара</span>
                  <input
                    value={form.goodsType}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, goodsType: event.target.value } : prev))
                    }
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className="text-zinc-600">Адрес</span>
                  <input
                    value={form.address}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, address: event.target.value } : prev))
                    }
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-600">Телефон</span>
                  <input
                    value={form.contactPhone}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, contactPhone: event.target.value } : prev,
                      )
                    }
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-600">Менеджер</span>
                  <input
                    value={form.managerName}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, managerName: event.target.value } : prev,
                      )
                    }
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-600">Состояние</span>
                  <input
                    value={form.condition}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, condition: event.target.value } : prev))
                    }
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className="text-zinc-600">Описание по умолчанию</span>
                  <textarea
                    value={form.descriptionFallback}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, descriptionFallback: event.target.value } : prev,
                      )
                    }
                    rows={3}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
                  />
                </label>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={updateSettings.isPending}
                    className="rounded-xl bg-teal-800 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-40"
                  >
                    {updateSettings.isPending ? 'Сохраняем…' : 'Сохранить настройки'}
                  </button>
                  {updateSettings.isError ? (
                    <p className="mt-2 text-sm text-red-600">{updateSettings.error.message}</p>
                  ) : null}
                  {updateSettings.isSuccess ? (
                    <p className="mt-2 text-sm text-teal-700">Настройки сохранены</p>
                  ) : null}
                </div>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur">
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">История выгрузок</h2>
              <p className="text-sm text-zinc-500">
                {runs.data ? `${runs.data.length} запусков` : 'Загрузка…'}
              </p>
            </div>

            {runs.isLoading ? (
              <p className="px-5 py-16 text-center text-sm text-zinc-500">Загружаем историю…</p>
            ) : runs.isError ? (
              <p className="px-5 py-16 text-center text-sm text-red-600">{runs.error.message}</p>
            ) : !runs.data || runs.data.length === 0 ? (
              <p className="px-5 py-16 text-center text-sm text-zinc-500">
                Выгрузок пока нет. Запустите выгрузку фида на Авито.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {runs.data.map((run) => (
                  <RunRow
                    key={run.id}
                    run={run}
                    expanded={expandedRunId === run.id}
                    onToggle={() =>
                      setExpandedRunId((current) => (current === run.id ? null : run.id))
                    }
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function RunRow({
  run,
  expanded,
  onToggle,
}: {
  run: AutoloadRun;
  expanded: boolean;
  onToggle: () => void;
}) {
  const items = useAutoloadRunItems(run.id, expanded);

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-zinc-50/80"
      >
        <span className="mt-0.5 text-zinc-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-lg px-2 py-0.5 text-xs font-medium',
                run.status === 'COMPLETED' && 'bg-teal-50 text-teal-800',
                run.status === 'FAILED' && 'bg-red-50 text-red-700',
                run.status === 'RUNNING' && 'bg-amber-50 text-amber-800',
                run.status === 'PENDING' && 'bg-zinc-100 text-zinc-600',
              )}
            >
              {AUTOLOAD_RUN_STATUS_LABEL[run.status] ?? run.status}
            </span>
            <span className="text-sm text-zinc-500">{formatDateTime(run.startedAt)}</span>
            {run.finishedAt ? (
              <span className="text-sm text-zinc-400">→ {formatDateTime(run.finishedAt)}</span>
            ) : null}
          </div>
          <div className="mt-1 text-sm text-zinc-700">
            Всего {run.itemsTotal} · ок {run.itemsOk} · ошибок {run.itemsError}
          </div>
          {run.lastError ? (
            <p className="mt-1 text-sm text-red-600">{run.lastError}</p>
          ) : null}
          {run.externalReportId ? (
            <p className="mt-1 text-xs text-zinc-400">Отчёт: {run.externalReportId}</p>
          ) : null}
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4">
          {items.isLoading ? (
            <p className="text-sm text-zinc-500">Загружаем позиции…</p>
          ) : items.isError ? (
            <p className="text-sm text-red-600">{items.error.message}</p>
          ) : !items.data || items.data.length === 0 ? (
            <p className="text-sm text-zinc-500">Позиций в отчёте нет</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Ad ID</th>
                    <th className="py-2 pr-3 font-medium">Авито</th>
                    <th className="py-2 pr-3 font-medium">Секция</th>
                    <th className="py-2 pr-3 font-medium">Статус</th>
                    <th className="py-2 font-medium">Сообщения</th>
                  </tr>
                </thead>
                <tbody>
                  {items.data.map((item) => (
                    <tr key={item.id} className="border-t border-zinc-100 align-top">
                      <td className="py-2 pr-3 font-mono text-xs text-zinc-700">{item.adId}</td>
                      <td className="py-2 pr-3">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-teal-800 hover:underline"
                          >
                            {item.avitoId ?? 'ссылка'}
                          </a>
                        ) : (
                          (item.avitoId ?? '—')
                        )}
                      </td>
                      <td className="py-2 pr-3 text-zinc-700">
                        {item.sectionTitle ?? item.section ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-zinc-700">{item.avitoStatus ?? '—'}</td>
                      <td className="max-w-xs py-2">
                        <pre className="whitespace-pre-wrap break-words font-sans text-xs text-zinc-600">
                          {formatMessages(item.messagesJson)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}

function CreateFeedListingSection({ channelAccountId }: { channelAccountId: string }) {
  const listings = useAutoloadListings(channelAccountId);
  const create = useCreateFeedListing();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedPrice = Number(price.replace(',', '.'));
    if (!title.trim() || !description.trim() || !Number.isFinite(parsedPrice)) {
      return;
    }

    create.mutate(
      {
        channelAccountId,
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        ...(sku.trim() ? { sku: sku.trim() } : {}),
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setPrice('');
          setSku('');
        },
      },
    );
  };

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Новое объявление</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Попадёт в XML-фид. После выгрузки Авито присвоит свой id — подтяните отчёт.
        Категория, адрес и телефон берутся из настроек фида ниже.
      </p>

      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-zinc-600">Название (до 50 символов)</span>
          <input
            value={title}
            maxLength={50}
            onChange={(e) => setTitle(e.target.value)}
            disabled={create.isPending}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-zinc-600">Описание</span>
          <textarea
            value={description}
            maxLength={7500}
            rows={5}
            onChange={(e) => setDescription(e.target.value)}
            disabled={create.isPending}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">Цена, ₽</span>
          <input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={create.isPending}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 tabular-nums"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600">SKU / Id в фиде (необязательно)</span>
          <input
            value={sku}
            maxLength={64}
            onChange={(e) => setSku(e.target.value)}
            disabled={create.isPending}
            placeholder="Сгенерируем автоматически"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2"
          />
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={create.isPending || !title.trim() || !description.trim() || !price}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            {create.isPending ? 'Сохраняем…' : 'Добавить в фид'}
          </button>
        </div>
      </form>

      {create.isError ? (
        <p className="mt-3 text-sm text-red-600">{create.error.message}</p>
      ) : null}
      {create.isSuccess ? (
        <p className="mt-3 text-sm text-teal-700">
          Добавлено. Нажмите «Выгрузить на Авито», когда будете готовы.
        </p>
      ) : null}

      <div className="mt-6 border-t border-zinc-100 pt-4">
        <h3 className="text-sm font-semibold text-zinc-900">Черновики в фиде</h3>
        {listings.isLoading ? (
          <p className="mt-2 text-sm text-zinc-500">Загружаем…</p>
        ) : listings.isError ? (
          <p className="mt-2 text-sm text-red-600">{listings.error.message}</p>
        ) : !listings.data?.length ? (
          <p className="mt-2 text-sm text-zinc-500">Пока пусто — создайте первое объявление выше.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {listings.data.map((item: FeedListing) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                <div>
                  <div className="font-medium text-zinc-900">{item.title}</div>
                  <div className="text-xs text-zinc-400">
                    Id: {item.sku} · {item.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <span className="text-xs text-zinc-500">{formatDateTime(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
