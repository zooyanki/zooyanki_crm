'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { MessengerPanel } from '@/features/messaging/messenger-panel';
import { SyncToolbar } from '@/features/sync/sync-toolbar';
import { useLogout, useMe } from '@/shared/api/hooks';
import { isAuthenticated } from '@/shared/auth/session';
import { AppNav } from '@/shared/ui/app-nav';

export default function MessagesPage() {
  const router = useRouter();
  const authenticated = typeof window !== 'undefined' && isAuthenticated();
  const me = useMe(authenticated);
  const logout = useLogout();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  if (!authenticated) {
    return (
      <main className="mx-auto flex min-h-full max-w-6xl items-center justify-center px-4 py-16 text-sm text-zinc-500">
        Переходим к входу…
      </main>
    );
  }

  if (me.isLoading) {
    return (
      <main className="mx-auto flex min-h-full max-w-6xl items-center justify-center px-4 py-16 text-sm text-zinc-500">
        Проверяем сессию…
      </main>
    );
  }

  if (me.isError) {
    return (
      <main className="mx-auto flex min-h-full max-w-6xl flex-col items-center justify-center gap-3 px-4 py-16 text-sm">
        <p className="text-red-600">Сессия недействительна</p>
        <button
          type="button"
          onClick={logout}
          className="rounded-xl bg-zinc-900 px-4 py-2 text-white"
        >
          Войти снова
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-800/80">
            Zooyanki CRM
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Сообщения
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
            {me.data
              ? `${me.data.user.name} · ${me.data.tenant.name}`
              : 'Диалоги с покупателями со всех подключённых площадок.'}
          </p>
          <AppNav />
        </div>
        <button
          type="button"
          onClick={logout}
          className="self-start rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Выйти
        </button>
      </header>

      <SyncToolbar showChats />
      <MessengerPanel />
    </main>
  );
}
