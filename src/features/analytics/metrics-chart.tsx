'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useDailyAnalytics } from '@/shared/api/hooks';
import { formatNumber } from '@/shared/lib/format';

function formatAxisDate(value: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short' }).format(date);
}

export function MetricsChart({
  channelAccountId,
  subtitle,
}: {
  channelAccountId?: string;
  subtitle?: string;
}) {
  const { data, isLoading, isError, error } = useDailyAnalytics(channelAccountId);

  if (isLoading) {
    return <ChartShell title="Показы, контакты и расходы">Загружаем метрики…</ChartShell>;
  }

  if (isError) {
    return (
      <ChartShell title="Показы, контакты и расходы">
        Не удалось загрузить аналитику: {error.message}
      </ChartShell>
    );
  }

  const rows = data ?? [];
  const totalViews = rows.reduce((sum, row) => sum + row.views, 0);
  const totalContacts = rows.reduce((sum, row) => sum + row.contacts, 0);
  const totalSpending = rows.reduce((sum, row) => sum + (row.spending ?? 0), 0);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Показы, контакты и расходы
          </h2>
          <p className="text-sm text-zinc-500">
            {subtitle ?? 'Суточная динамика по объявлениям выбранной площадки'}
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <MetricBadge label="Показы" value={formatNumber(totalViews)} />
          <MetricBadge label="Контакты" value={formatNumber(totalContacts)} />
          <MetricBadge label="Расходы" value={`${formatNumber(totalSpending)} ₽`} />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">
          Пока нет данных. Запустите синхронизацию статистики.
        </p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatAxisDate}
                tick={{ fill: '#71717a', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="metrics"
                tick={{ fill: '#71717a', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <YAxis
                yAxisId="money"
                orientation="right"
                tick={{ fill: '#71717a', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e4e4e7',
                  boxShadow: '0 8px 24px rgba(24, 24, 27, 0.08)',
                }}
                labelFormatter={(label) => formatAxisDate(String(label))}
              />
              <Legend />
              <Line
                yAxisId="metrics"
                type="monotone"
                dataKey="views"
                name="Показы"
                stroke="#0f766e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="metrics"
                type="monotone"
                dataKey="contacts"
                name="Контакты"
                stroke="#b45309"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="money"
                type="monotone"
                dataKey="spending"
                name="Расходы, ₽"
                stroke="#be123c"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="text-base font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
      <p className="py-16 text-center text-sm text-zinc-500">{children}</p>
    </section>
  );
}
