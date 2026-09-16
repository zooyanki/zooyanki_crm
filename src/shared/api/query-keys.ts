export const queryKeys = {
  listings: (params: { page: number; perPage: number; status?: string }) =>
    ['listings', params] as const,
  listingVas: (listingId: string) => ['listings', listingId, 'vas'] as const,
  orders: (params: { page: number; perPage: number; status?: string }) =>
    ['orders', params] as const,
  orderCourierRange: (orderId: string, address?: string) =>
    ['orders', orderId, 'courier-range', address ?? null] as const,
  inventory: (params: { page: number; perPage: number }) =>
    ['inventory', params] as const,
  inventoryByListing: (listingId: string) =>
    ['inventory', 'by-listing', listingId] as const,
  walletBalance: (channelAccountId: string) =>
    ['wallet', 'balance', channelAccountId] as const,
  walletOperations: (params: {
    channelAccountId: string;
    dateFrom: string;
    dateTo: string;
  }) => ['wallet', 'operations', params] as const,
  analyticsDaily: () => ['analytics', 'daily'] as const,
  conversations: (params: { page: number; perPage: number }) =>
    ['conversations', params] as const,
  messages: (conversationId: string, params: { page: number; perPage: number }) =>
    ['messages', conversationId, params] as const,
  channelAccounts: () => ['channel-accounts'] as const,
  tenantCurrent: () => ['tenants', 'current'] as const,
  me: () => ['auth', 'me'] as const,
  autoloadSettings: (channelAccountId: string) =>
    ['autoload', 'settings', channelAccountId] as const,
  autoloadListings: (channelAccountId: string) =>
    ['autoload', 'listings', channelAccountId] as const,
  autoloadRuns: (channelAccountId: string) =>
    ['autoload', 'runs', channelAccountId] as const,
  autoloadRunItems: (runId: string) =>
    ['autoload', 'runs', runId, 'items'] as const,
  reviews: (params: { page: number; perPage: number }) =>
    ['reviews', params] as const,
};
