'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  useOrderAcceptReturn,
  useOrderCncDetails,
  useOrderCourierRange,
  useOrderLabels,
  useOrderMarkings,
  useOrderTrackingNumber,
  useOrderTransition,
  useOrders,
  useSetOrderCourierRange,
  type OrderStatus,
  type OrderTransition,
  type OrderView,
} from '@/shared/api/hooks';
import { formatDateTime, formatPrice } from '@/shared/lib/format';
import { CHANNEL_LABEL, ORDER_ACTION_LABEL, ORDER_STATUS_LABEL } from '@/shared/lib/labels';
import { cn } from '@/shared/lib/utils';

const STATUS_FILTERS: Array<{ value?: OrderStatus; label: string }> = [
  { label: 'Все' },
  { value: 'PENDING_CONFIRMATION', label: 'Ждут подтверждения' },
  { value: 'READY_TO_SHIP', label: 'К отправке' },
  { value: 'IN_TRANSIT', label: 'В пути' },
  { value: 'DELIVERED', label: 'Доставлены' },
  { value: 'CANCELED', label: 'Отменены' },
  { value: 'ON_RETURN', label: 'На возврате' },
];

const TRANSITIONS = new Set<OrderTransition>(['confirm', 'reject', 'perform', 'receive']);

const LABEL_STATUSES = new Set<OrderStatus>(['READY_TO_SHIP', 'IN_TRANSIT']);

const PER_PAGE = 20;

function downloadBase64Pdf(filename: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function OrdersTable() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);

  const { data, isLoading, isError, error, isFetching } = useOrders({
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
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Заказы</h2>
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
        <p className="px-5 py-16 text-center text-sm text-zinc-500">Загружаем заказы…</p>
      ) : isError ? (
        <p className="px-5 py-16 text-center text-sm text-red-600">
          Не удалось загрузить список: {error.message}
        </p>
      ) : !data || data.items.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-zinc-500">
          Заказов пока нет. Нужна Авито Доставка на аккаунте и синхронизация заказов.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-medium">Заказ</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Позиции</th>
                <th className="px-5 py-3 font-medium">Сумма</th>
                <th className="px-5 py-3 font-medium">Дата</th>
                <th className="px-5 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.items.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > PER_PAGE ? (
        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 text-sm">
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
    </section>
  );
}

function OrderRow({ order }: { order: OrderView }) {
  const transition = useOrderTransition();
  const tracking = useOrderTrackingNumber();
  const acceptReturn = useOrderAcceptReturn();
  const labels = useOrderLabels();
  const markings = useOrderMarkings();
  const setCourier = useSetOrderCourierRange();
  const cnc = useOrderCncDetails();

  const [trackingNumber, setTrackingNumber] = useState('');
  const [showTracking, setShowTracking] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [terminalNumber, setTerminalNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [showMarkings, setShowMarkings] = useState(false);
  const [markingInputs, setMarkingInputs] = useState<Record<string, string>>({});

  const [showCourier, setShowCourier] = useState(false);
  const [courierAddress, setCourierAddress] = useState('');
  const [courierAddressDetails, setCourierAddressDetails] = useState('');
  const [courierName, setCourierName] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [selectedInterval, setSelectedInterval] = useState('');

  const [showCnc, setShowCnc] = useState(false);
  const [bookingPeriod, setBookingPeriod] = useState('4');
  const [cncAddress, setCncAddress] = useState('');
  const [cncDetails, setCncDetails] = useState('');

  const courierRange = useOrderCourierRange(order.id, undefined, showCourier);

  useEffect(() => {
    if (!courierRange.data || !showCourier) return;
    setCourierAddress((prev) => prev || courierRange.data.address || '');
    setCourierAddressDetails((prev) => prev || courierRange.data.addressDetails || '');
    setCourierName((prev) => prev || courierRange.data.name || '');
    setCourierPhone((prev) => prev || courierRange.data.phone || '');
  }, [courierRange.data, showCourier]);

  const itemsSummary =
    order.items.length === 0
      ? '—'
      : order.items.length === 1
        ? order.items[0].title
        : `${order.items[0].title} и ещё ${order.items.length - 1}`;

  const actions = order.availableActions ?? [];
  const transitionActions = actions.filter((action) =>
    TRANSITIONS.has(action.name as OrderTransition),
  );
  const needsTracking = actions.some(
    (action) => action.name === 'setTrackNumber' || action.name === 'fixTrackNumber',
  );
  const needsReturn = actions.some((action) => action.name === 'acceptReturnOrder');
  const needsMarkings = actions.some((action) => action.name === 'setMarkings');
  const needsCourier = actions.some(
    (action) =>
      action.name === 'getCourierDeliveryRange' || action.name === 'setCourierDeliveryRange',
  );
  const needsCnc = actions.some((action) => action.name === 'setCNCDetails');
  const canDownloadLabel =
    Boolean(order.marketplaceId) && LABEL_STATUSES.has(order.status);
  const markingItems = order.items.filter((item) => item.avitoId);
  const busy =
    transition.isPending ||
    tracking.isPending ||
    acceptReturn.isPending ||
    labels.isPending ||
    markings.isPending ||
    setCourier.isPending ||
    cnc.isPending;

  const intervalOptions = useMemo(() => {
    const options: Array<{
      key: string;
      label: string;
      startDate: string;
      endDate: string;
      type: 'fixed' | 'asap';
    }> = [];
    for (const day of courierRange.data?.dateOptions ?? []) {
      for (const interval of day.timeIntervals) {
        const type = interval.type === 'asap' ? 'asap' : 'fixed';
        options.push({
          key: `${interval.startDate}|${interval.endDate}|${type}`,
          label:
            interval.title ??
            `${day.date} · ${formatDateTime(interval.startDate)} – ${formatDateTime(interval.endDate)}`,
          startDate: interval.startDate,
          endDate: interval.endDate,
          type,
        });
      }
    }
    return options;
  }, [courierRange.data]);

  const hasActions =
    transitionActions.length > 0 ||
    needsTracking ||
    needsReturn ||
    needsMarkings ||
    needsCourier ||
    needsCnc ||
    canDownloadLabel;

  return (
    <tr className="align-top hover:bg-zinc-50/60">
      <td className="px-5 py-3">
        <div className="font-medium text-zinc-900">#{order.externalId}</div>
        <div className="text-xs text-zinc-500">
          {CHANNEL_LABEL[order.channel] ?? order.channel}
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="font-medium text-zinc-800">
          {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </div>
        <div className="text-xs text-zinc-500">{order.rawStatus}</div>
      </td>
      <td className="max-w-xs px-5 py-3 text-zinc-700">
        <div className="truncate">{itemsSummary}</div>
        <div className="text-xs text-zinc-500">{order.items.length} шт.</div>
      </td>
      <td className="px-5 py-3 font-medium text-zinc-900">
        {formatPrice(order.totalAmount, order.currency)}
      </td>
      <td className="px-5 py-3 text-zinc-600">{formatDateTime(order.placedAt)}</td>
      <td className="px-5 py-3">
        {!hasActions ? (
          <span className="text-xs text-zinc-400">—</span>
        ) : (
          <div className="flex min-w-[220px] flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {transitionActions.map((action) => (
                <button
                  key={action.name}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (action.name === 'reject' && !window.confirm('Отменить заказ на Авито?')) {
                      return;
                    }
                    transition.mutate({
                      orderId: order.id,
                      body: { transition: action.name as OrderTransition },
                    });
                  }}
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-medium transition disabled:opacity-40',
                    action.name === 'reject'
                      ? 'border border-red-200 text-red-700 hover:bg-red-50'
                      : action.required
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                        : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50',
                  )}
                >
                  {ORDER_ACTION_LABEL[action.name] ?? action.name}
                </button>
              ))}
              {needsTracking ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowTracking((value) => !value)}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                >
                  {ORDER_ACTION_LABEL.setTrackNumber}
                </button>
              ) : null}
              {canDownloadLabel ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    labels.mutate(order.id, {
                      onSuccess: (result) => {
                        downloadBase64Pdf(result.filename, result.data);
                      },
                    });
                  }}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                >
                  {ORDER_ACTION_LABEL.downloadLabels}
                </button>
              ) : null}
              {needsReturn ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowReturn((value) => !value)}
                  className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                >
                  {ORDER_ACTION_LABEL.acceptReturnOrder}
                </button>
              ) : null}
              {needsMarkings ? (
                <button
                  type="button"
                  disabled={busy || markingItems.length === 0}
                  onClick={() => setShowMarkings((value) => !value)}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                >
                  {ORDER_ACTION_LABEL.setMarkings}
                </button>
              ) : null}
              {needsCourier ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowCourier((value) => !value)}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                >
                  {ORDER_ACTION_LABEL.setCourierDeliveryRange}
                </button>
              ) : null}
              {needsCnc ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setShowCnc((value) => !value)}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                >
                  {ORDER_ACTION_LABEL.setCNCDetails}
                </button>
              ) : null}
            </div>

            {showTracking ? (
              <form
                className="flex gap-1.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  tracking.mutate({
                    orderId: order.id,
                    body: { trackingNumber },
                  });
                  setShowTracking(false);
                  setTrackingNumber('');
                }}
              >
                <input
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder="Трек-номер"
                  className="w-28 rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={busy || trackingNumber.trim().length < 3}
                  className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-40"
                >
                  OK
                </button>
              </form>
            ) : null}

            {showReturn ? (
              <form
                className="flex flex-col gap-1.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  acceptReturn.mutate({
                    orderId: order.id,
                    body: {
                      terminalNumber,
                      recipientName,
                      recipientPhone,
                    },
                  });
                  setShowReturn(false);
                  setTerminalNumber('');
                  setRecipientName('');
                  setRecipientPhone('');
                }}
              >
                <input
                  value={terminalNumber}
                  onChange={(event) => setTerminalNumber(event.target.value)}
                  placeholder="Отделение Почты"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <input
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  placeholder="ФИО получателя"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <input
                  value={recipientPhone}
                  onChange={(event) => setRecipientPhone(event.target.value)}
                  placeholder="Телефон"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={
                    busy ||
                    !terminalNumber.trim() ||
                    recipientName.trim().length < 2 ||
                    recipientPhone.trim().length < 5
                  }
                  className="rounded-lg bg-amber-700 px-2 py-1 text-xs text-white disabled:opacity-40"
                >
                  Отправить
                </button>
              </form>
            ) : null}

            {showMarkings ? (
              <form
                className="flex flex-col gap-1.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const items = markingItems
                    .map((item) => {
                      const raw = markingInputs[item.avitoId!] ?? '';
                      const codes = raw
                        .split(/[,;\s]+/)
                        .map((code) => code.trim())
                        .filter(Boolean);
                      return { itemId: item.avitoId!, markings: codes };
                    })
                    .filter((item) => item.markings.length > 0);

                  if (items.length === 0) return;

                  markings.mutate({
                    orderId: order.id,
                    body: { items },
                  });
                  setShowMarkings(false);
                  setMarkingInputs({});
                }}
              >
                {markingItems.map((item) => (
                  <label key={item.id} className="flex flex-col gap-0.5">
                    <span className="truncate text-[11px] text-zinc-500">
                      {item.title} · #{item.avitoId}
                    </span>
                    <input
                      value={markingInputs[item.avitoId!] ?? ''}
                      onChange={(event) =>
                        setMarkingInputs((prev) => ({
                          ...prev,
                          [item.avitoId!]: event.target.value,
                        }))
                      }
                      placeholder="Коды через запятую"
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-40"
                >
                  Отправить
                </button>
              </form>
            ) : null}

            {showCourier ? (
              <form
                className="flex flex-col gap-1.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const option = intervalOptions.find((item) => item.key === selectedInterval);
                  if (!option) return;

                  setCourier.mutate({
                    orderId: order.id,
                    body: {
                      address: courierAddress.trim(),
                      ...(courierAddressDetails.trim()
                        ? { addressDetails: courierAddressDetails.trim() }
                        : {}),
                      startDate: option.startDate,
                      endDate: option.endDate,
                      intervalType: option.type,
                      phone: courierPhone.trim(),
                      name: courierName.trim(),
                    },
                  });
                  setShowCourier(false);
                  setSelectedInterval('');
                }}
              >
                {courierRange.isLoading ? (
                  <p className="text-xs text-zinc-500">Загружаем окна…</p>
                ) : null}
                {courierRange.isError ? (
                  <p className="text-xs text-red-600">{courierRange.error.message}</p>
                ) : null}
                <select
                  value={selectedInterval}
                  onChange={(event) => setSelectedInterval(event.target.value)}
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                >
                  <option value="">Интервал…</option>
                  {intervalOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  value={courierName}
                  onChange={(event) => setCourierName(event.target.value)}
                  placeholder="Имя"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <input
                  value={courierPhone}
                  onChange={(event) => setCourierPhone(event.target.value)}
                  placeholder="Телефон"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <input
                  value={courierAddress}
                  onChange={(event) => setCourierAddress(event.target.value)}
                  placeholder="Адрес"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <input
                  value={courierAddressDetails}
                  onChange={(event) => setCourierAddressDetails(event.target.value)}
                  placeholder="Подъезд / этаж"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={
                    busy ||
                    !selectedInterval ||
                    courierName.trim().length < 2 ||
                    courierPhone.trim().length < 5 ||
                    !courierAddress.trim()
                  }
                  className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-40"
                >
                  Вызвать
                </button>
              </form>
            ) : null}

            {showCnc ? (
              <form
                className="flex flex-col gap-1.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const period = Number.parseInt(bookingPeriod, 10);
                  if (!Number.isFinite(period) || period < 1) return;

                  cnc.mutate({
                    orderId: order.id,
                    body: {
                      bookingPeriod: period,
                      ...(cncAddress.trim() ? { address: cncAddress.trim() } : {}),
                      ...(cncDetails.trim() ? { details: cncDetails.trim() } : {}),
                    },
                  });
                  setShowCnc(false);
                }}
              >
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={bookingPeriod}
                  onChange={(event) => setBookingPeriod(event.target.value)}
                  placeholder="Дней брони"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <input
                  value={cncAddress}
                  onChange={(event) => setCncAddress(event.target.value)}
                  placeholder="Адрес (необяз.)"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <input
                  value={cncDetails}
                  onChange={(event) => setCncDetails(event.target.value)}
                  placeholder="Комментарий (необяз.)"
                  className="rounded-lg border border-zinc-200 px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={busy || !bookingPeriod}
                  className="rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white disabled:opacity-40"
                >
                  Отправить
                </button>
              </form>
            ) : null}

            {transition.isError ? (
              <p className="text-xs text-red-600">{transition.error.message}</p>
            ) : null}
            {tracking.isError ? (
              <p className="text-xs text-red-600">{tracking.error.message}</p>
            ) : null}
            {acceptReturn.isError ? (
              <p className="text-xs text-red-600">{acceptReturn.error.message}</p>
            ) : null}
            {labels.isError ? (
              <p className="text-xs text-red-600">{labels.error.message}</p>
            ) : null}
            {markings.isError ? (
              <p className="text-xs text-red-600">{markings.error.message}</p>
            ) : null}
            {setCourier.isError ? (
              <p className="text-xs text-red-600">{setCourier.error.message}</p>
            ) : null}
            {cnc.isError ? (
              <p className="text-xs text-red-600">{cnc.error.message}</p>
            ) : null}
            {transition.isSuccess ||
            tracking.isSuccess ||
            acceptReturn.isSuccess ||
            markings.isSuccess ||
            setCourier.isSuccess ||
            cnc.isSuccess ? (
              <p className="text-xs text-teal-700">В очереди на Авито</p>
            ) : null}
          </div>
        )}
      </td>
    </tr>
  );
}
