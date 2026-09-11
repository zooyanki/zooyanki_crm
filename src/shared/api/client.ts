import createClient from 'openapi-fetch';

import type { paths } from './generated/schema';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export function getTenantId(): string {
  const id = process.env.NEXT_PUBLIC_TENANT_ID;
  if (!id) {
    throw new Error('Не задан NEXT_PUBLIC_TENANT_ID — без арендатора API недоступен');
  }
  return id;
}

/// Единственная точка выхода к бэкенду. Типы — из OpenAPI-схемы,
/// руками DTO здесь не пишутся.
export const api = createClient<paths>({ baseUrl });

api.use({
  onRequest({ request }) {
    request.headers.set('x-tenant-id', getTenantId());
    return request;
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

export function tenantHeader() {
  return { 'x-tenant-id': getTenantId() } as const;
}
