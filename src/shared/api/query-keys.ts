export const queryKeys = {
  listings: (params: { page: number; perPage: number; status?: string }) =>
    ['listings', params] as const,
  analyticsDaily: () => ['analytics', 'daily'] as const,
  channelAccounts: () => ['channel-accounts'] as const,
  tenantCurrent: () => ['tenants', 'current'] as const,
  me: () => ['auth', 'me'] as const,
};
