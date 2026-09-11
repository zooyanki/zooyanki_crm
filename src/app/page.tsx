'use client';

import { MetricsChart } from '@/features/analytics/metrics-chart';
import { ListingsTable } from '@/features/listings/listings-table';
import { SyncToolbar } from '@/features/sync/sync-toolbar';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-800/80">
          Zooyanki CRM
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Объявления и контакты
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
          Импорт с Авито, статусы публикаций и суточная динамика показов и контактов в одном месте.
        </p>
      </header>

      <SyncToolbar />
      <MetricsChart />
      <ListingsTable />
    </main>
  );
}
