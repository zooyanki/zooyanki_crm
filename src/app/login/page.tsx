'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { ApiError } from '@/shared/api/client';
import { useLogin, useRegister } from '@/shared/api/hooks';
import { isAuthenticated } from '@/shared/auth/session';
import { cn } from '@/shared/lib/utils';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const register = useRegister();

  const bootstrapTenantId = process.env.NEXT_PUBLIC_BOOTSTRAP_TENANT_ID;
  const [mode, setMode] = useState<Mode>(bootstrapTenantId ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState('Zooyanki');
  const [error, setError] = useState<string | null>(null);

  const pending = login.isPending || register.isPending;

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/');
    }
  }, [router]);

  const subtitle = useMemo(() => {
    if (mode === 'login') {
      return 'Войдите, чтобы открыть объявления и аналитику.';
    }
    return bootstrapTenantId
      ? 'Создайте владельца для уже существующего арендатора с данными Авито.'
      : 'Создайте аккаунт и новый арендатор.';
  }, [mode, bootstrapTenantId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      if (mode === 'login') {
        await login.mutateAsync({ email, password });
        router.replace('/');
      } else {
        await register.mutateAsync({
          email,
          password,
          name,
          ...(bootstrapTenantId
            ? { claimTenantId: bootstrapTenantId }
            : { tenantName }),
        });
        router.replace('/');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось выполнить запрос');
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-800/80">
          Zooyanki CRM
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-900">
          {mode === 'login' ? 'Вход' : 'Первая настройка'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{subtitle}</p>
      </div>

      <div className="flex gap-2 rounded-xl bg-zinc-100 p-1">
        <ModeButton active={mode === 'login'} onClick={() => setMode('login')}>
          Вход
        </ModeButton>
        <ModeButton active={mode === 'register'} onClick={() => setMode('register')}>
          Регистрация
        </ModeButton>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur"
      >
        {mode === 'register' ? (
          <Field label="Имя">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Илья"
            />
          </Field>
        ) : null}

        <Field label="Email">
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="owner@zooyanki.ru"
          />
        </Field>

        <Field label="Пароль">
          <input
            required
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Не меньше 8 символов"
          />
        </Field>

        {mode === 'register' && !bootstrapTenantId ? (
          <Field label="Название компании">
            <input
              required
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              className={inputClass}
            />
          </Field>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать владельца'}
        </button>
      </form>
    </main>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
        active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-800',
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none ring-teal-700/30 placeholder:text-zinc-400 focus:ring-2';
