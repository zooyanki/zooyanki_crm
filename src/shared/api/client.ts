import createClient from 'openapi-fetch';

import { clearAccessToken, getAccessToken } from '@/shared/auth/session';

import type { paths } from './generated/schema';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/// Единственная точка выхода к бэкенду. Типы — из OpenAPI-схемы,
/// руками DTO здесь не пишутся.
export const api = createClient<paths>({ baseUrl });

api.use({
  onRequest({ request }) {
    const token = getAccessToken();
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
  onResponse({ response }) {
    if (response.status === 401 && typeof window !== 'undefined') {
      clearAccessToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return response;
  },
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function unwrap<T>(
  result: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await result;

  if (!response.ok || error !== undefined || data === undefined) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : `Ошибка API ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data;
}
