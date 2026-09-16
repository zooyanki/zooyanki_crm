import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clearAccessToken, getAccessToken, setAccessToken } from '@/shared/auth/session';

import { ApiError, api, unwrap } from './client';
import type { components } from './generated/schema';
import { queryKeys } from './query-keys';

export type ListingView = components['schemas']['ListingViewDto'];
export type ListingListResult = components['schemas']['ListingListResultDto'];
export type DailyTotals = components['schemas']['DailyTotalsDto'];
export type ChannelAccount = components['schemas']['ChannelAccountViewDto'];
export type ListingStatus = ListingView['status'];
export type OrderView = components['schemas']['OrderViewDto'];
export type OrderListResult = components['schemas']['OrderListResultDto'];
export type OrderStatus = OrderView['status'];
export type OrderAction = components['schemas']['OrderActionViewDto'];
export type OrderTransition = components['schemas']['ApplyOrderTransitionDto']['transition'];
export type AuthResponse = components['schemas']['AuthResponseDto'];
export type MeResponse = components['schemas']['MeResponseDto'];
export type SyncEntity = components['schemas']['TriggerSyncDto']['entity'];
export type InventoryView = components['schemas']['InventoryViewDto'];
export type InventoryListResult = components['schemas']['InventoryListResultDto'];
export type VasOffer = components['schemas']['VasOfferDto'];
export type CourierRangeResult = components['schemas']['CourierRangeResultDto'];
export type WalletBalance = components['schemas']['WalletBalanceDto'];
export type WalletOperationsResult = components['schemas']['WalletOperationsResultDto'];
export type ConversationView = components['schemas']['ConversationViewDto'];
export type ConversationListResult = components['schemas']['ConversationListResultDto'];
export type MessageView = components['schemas']['MessageViewDto'];
export type MessageListResult = components['schemas']['MessageListResultDto'];
export type MessageDirection = MessageView['direction'];
export type MessageType = MessageView['type'];
export type AutoloadSettings = components['schemas']['AutoloadSettingsDto'];
export type AutoloadRun = components['schemas']['AutoloadRunDto'];
export type AutoloadItem = components['schemas']['AutoloadItemDto'];
export type AutoloadRunStatus = AutoloadRun['status'];
export type FeedListing = components['schemas']['FeedListingDto'];
export type ReviewView = components['schemas']['ReviewViewDto'];
export type ReviewListResult = components['schemas']['ReviewListResultDto'];

export function useListings(params: {
  page: number;
  perPage: number;
  status?: ListingStatus;
}) {
  return useQuery({
    queryKey: queryKeys.listings(params),
    queryFn: () =>
      unwrap(
        api.GET('/api/listings', {
          params: {
            query: {
              page: params.page,
              perPage: params.perPage,
              ...(params.status ? { status: params.status } : {}),
            },
          },
        }),
      ),
  });
}

export function useUpdateListingPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      listingId: string;
      body: components['schemas']['UpdateListingPriceDto'];
    }) =>
      unwrap(
        api.POST('/api/listings/{id}/price', {
          params: { path: { id: input.listingId } },
          body: input.body,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useListingVas(listingId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.listingVas(listingId),
    queryFn: () =>
      unwrap(
        api.GET('/api/listings/{id}/vas', {
          params: { path: { id: listingId } },
        }),
      ),
    enabled: enabled && Boolean(listingId),
  });
}

export function useApplyVas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      listingId: string;
      body: components['schemas']['ApplyVasDto'];
    }) =>
      unwrap(
        api.POST('/api/listings/{id}/vas', {
          params: { path: { id: input.listingId } },
          body: input.body,
        }),
      ),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listings'] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.listingVas(variables.listingId),
        }),
      ]);
    },
  });
}

export function useDailyAnalytics() {
  return useQuery({
    queryKey: queryKeys.analyticsDaily(),
    queryFn: () => unwrap(api.GET('/api/analytics/daily')),
  });
}

export function useOrders(params: {
  page: number;
  perPage: number;
  status?: OrderStatus;
}) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () =>
      unwrap(
        api.GET('/api/orders', {
          params: {
            query: {
              page: params.page,
              perPage: params.perPage,
              ...(params.status ? { status: params.status } : {}),
            },
          },
        }),
      ),
  });
}

export function useOrderTransition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      orderId: string;
      body: components['schemas']['ApplyOrderTransitionDto'];
    }) =>
      unwrap(
        api.POST('/api/orders/{id}/transition', {
          params: { path: { id: input.orderId } },
          body: input.body,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrderTrackingNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      orderId: string;
      body: components['schemas']['SetOrderTrackingDto'];
    }) =>
      unwrap(
        api.POST('/api/orders/{id}/tracking-number', {
          params: { path: { id: input.orderId } },
          body: input.body,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrderAcceptReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      orderId: string;
      body: components['schemas']['AcceptOrderReturnDto'];
    }) =>
      unwrap(
        api.POST('/api/orders/{id}/accept-return', {
          params: { path: { id: input.orderId } },
          body: input.body,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrderLabels() {
  return useMutation({
    mutationFn: (orderId: string) =>
      unwrap(
        api.POST('/api/orders/{id}/labels', {
          params: { path: { id: orderId } },
        }),
      ),
  });
}

export function useOrderMarkings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      orderId: string;
      body: components['schemas']['SetOrderMarkingsDto'];
    }) =>
      unwrap(
        api.POST('/api/orders/{id}/markings', {
          params: { path: { id: input.orderId } },
          body: input.body,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrderCourierRange(
  orderId: string,
  address?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.orderCourierRange(orderId, address),
    queryFn: () =>
      unwrap(
        api.GET('/api/orders/{id}/courier-range', {
          params: {
            path: { id: orderId },
            query: address ? { address } : {},
          },
        }),
      ),
    enabled: enabled && Boolean(orderId),
  });
}

export function useSetOrderCourierRange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      orderId: string;
      body: components['schemas']['SetCourierRangeDto'];
    }) =>
      unwrap(
        api.POST('/api/orders/{id}/courier-range', {
          params: { path: { id: input.orderId } },
          body: input.body,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useOrderCncDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      orderId: string;
      body: components['schemas']['SetCncDetailsDto'];
    }) =>
      unwrap(
        api.POST('/api/orders/{id}/cnc-details', {
          params: { path: { id: input.orderId } },
          body: input.body,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useWalletBalance(channelAccountId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.walletBalance(channelAccountId),
    queryFn: () =>
      unwrap(
        api.GET('/api/wallet/balance', {
          params: { query: { channelAccountId } },
        }),
      ),
    enabled: enabled && Boolean(channelAccountId),
  });
}

export function useWalletOperations(
  params: {
    channelAccountId: string;
    dateFrom: string;
    dateTo: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.walletOperations(params),
    queryFn: () =>
      unwrap(
        api.GET('/api/wallet/operations', {
          params: {
            query: {
              channelAccountId: params.channelAccountId,
              dateFrom: params.dateFrom,
              dateTo: params.dateTo,
            },
          },
        }),
      ),
    enabled:
      enabled &&
      Boolean(params.channelAccountId && params.dateFrom && params.dateTo),
  });
}

export function useInventory(params: { page: number; perPage: number }) {
  return useQuery({
    queryKey: queryKeys.inventory(params),
    queryFn: () =>
      unwrap(
        api.GET('/api/inventory', {
          params: {
            query: {
              page: params.page,
              perPage: params.perPage,
            },
          },
        }),
      ),
  });
}

export function useInventoryByListing(listingId: string) {
  return useQuery({
    queryKey: queryKeys.inventoryByListing(listingId),
    queryFn: async () => {
      const result = await api.GET('/api/inventory/by-listing/{listingId}', {
        params: { path: { listingId } },
      });

      if (result.response.ok && result.error === undefined) {
        return result.data ?? null;
      }

      return unwrap(Promise.resolve(result));
    },
    enabled: Boolean(listingId),
  });
}

export function useAdjustInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: components['schemas']['AdjustInventoryDto']) =>
      unwrap(api.POST('/api/inventory/adjust', { body })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useChannelAccounts() {
  return useQuery({
    queryKey: queryKeys.channelAccounts(),
    queryFn: () => unwrap(api.GET('/api/channel-accounts')),
  });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => unwrap(api.GET('/api/auth/me')),
    enabled,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: components['schemas']['LoginDto']) =>
      unwrap(api.POST('/api/auth/login', { body })),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(queryKeys.me(), {
        user: data.user,
        tenant: data.tenant,
      } satisfies MeResponse);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: components['schemas']['RegisterDto']) =>
      unwrap(api.POST('/api/auth/register', { body })),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(queryKeys.me(), {
        user: data.user,
        tenant: data.tenant,
      } satisfies MeResponse);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    clearAccessToken();
    queryClient.clear();
    window.location.assign('/login');
  };
}

export function useConversations(params: { page: number; perPage: number }) {
  return useQuery({
    queryKey: queryKeys.conversations(params),
    queryFn: () =>
      unwrap(
        api.GET('/api/messaging/conversations', {
          params: {
            query: {
              page: params.page,
              perPage: params.perPage,
            },
          },
        }),
      ),
  });
}

export function useMessages(
  conversationId: string,
  params: { page: number; perPage: number },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.messages(conversationId, params),
    queryFn: () =>
      unwrap(
        api.GET('/api/messaging/conversations/{id}/messages', {
          params: {
            path: { id: conversationId },
            query: {
              page: params.page,
              perPage: params.perPage,
            },
          },
        }),
      ),
    enabled: enabled && Boolean(conversationId),
  });
}

export function useSendTextMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { conversationId: string; text: string }) =>
      unwrap(
        api.POST('/api/messaging/conversations/{id}/messages', {
          params: { path: { id: input.conversationId } },
          body: { text: input.text },
        }),
      ),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        queryClient.invalidateQueries({
          queryKey: ['messages', variables.conversationId],
        }),
      ]);
    },
  });
}

async function postMessageImage(
  conversationId: string,
  file: File,
): Promise<MessageView> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const token = getAccessToken();
  const form = new FormData();
  form.append('file', file);

  const response = await fetch(
    `${baseUrl}/api/messaging/conversations/${conversationId}/messages/image`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    },
  );

  if (!response.ok) {
    let message = `Ошибка API ${response.status}`;
    try {
      const errorBody = (await response.json()) as { message?: unknown };
      if (errorBody.message !== undefined) {
        message = String(errorBody.message);
      }
    } catch {
      // keep default
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as MessageView;
}

export function useSendImageMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { conversationId: string; file: File }) =>
      postMessageImage(input.conversationId, input.file),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        queryClient.invalidateQueries({
          queryKey: ['messages', variables.conversationId],
        }),
      ]);
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      unwrap(
        api.POST('/api/messaging/conversations/{id}/read', {
          params: { path: { id: conversationId } },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSyncConversationMessages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      unwrap(
        api.POST('/api/messaging/conversations/{id}/sync', {
          params: { path: { id: conversationId } },
        }),
      ),
    onSuccess: async (_data, conversationId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }),
      ]);
    },
  });
}

export function useSubscribeWebhook() {
  return useMutation({
    mutationFn: (body: components['schemas']['SubscribeWebhookDto']) =>
      unwrap(api.POST('/api/messaging/webhook/subscribe', { body })),
  });
}

export function useUnsubscribeWebhook() {
  return useMutation({
    mutationFn: (body: components['schemas']['SubscribeWebhookDto']) =>
      unwrap(api.POST('/api/messaging/webhook/unsubscribe', { body })),
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: components['schemas']['TriggerSyncDto']) =>
      unwrap(api.POST('/api/sync/trigger', { body })),
    onSuccess: async (_data, variables) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listings'] }),
        variables.entity === 'stats'
          ? queryClient.invalidateQueries({ queryKey: queryKeys.analyticsDaily() })
          : Promise.resolve(),
        variables.entity === 'orders'
          ? queryClient.invalidateQueries({ queryKey: ['orders'] })
          : Promise.resolve(),
        variables.entity === 'chats'
          ? queryClient.invalidateQueries({ queryKey: ['conversations'] })
          : Promise.resolve(),
        variables.entity === 'reviews'
          ? queryClient.invalidateQueries({ queryKey: ['reviews'] })
          : Promise.resolve(),
        variables.entity === 'stocks'
          ? queryClient.invalidateQueries({ queryKey: ['inventory'] })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: queryKeys.channelAccounts() }),
      ]);
    },
  });
}

export function useAutoloadSettings(channelAccountId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.autoloadSettings(channelAccountId),
    queryFn: () =>
      unwrap(
        api.GET('/api/autoload/settings', {
          params: { query: { channelAccountId } },
        }),
      ),
    enabled: enabled && Boolean(channelAccountId),
  });
}

export function useAutoloadListings(channelAccountId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.autoloadListings(channelAccountId),
    queryFn: () =>
      unwrap(
        api.GET('/api/autoload/listings', {
          params: { query: { channelAccountId } },
        }),
      ),
    enabled: enabled && Boolean(channelAccountId),
  });
}

export function useCreateFeedListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: components['schemas']['CreateFeedListingDto']) =>
      unwrap(api.POST('/api/autoload/listings', { body })),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.autoloadListings(data.channelAccountId),
      });
    },
  });
}

export function useUpdateAutoloadSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      channelAccountId: string;
      body: components['schemas']['UpdateAutoloadSettingsDto'];
    }) =>
      unwrap(
        api.PUT('/api/autoload/settings', {
          params: { query: { channelAccountId: input.channelAccountId } },
          body: input.body,
        }),
      ),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.autoloadSettings(data.channelAccountId),
      });
    },
  });
}

export function useAutoloadRuns(channelAccountId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.autoloadRuns(channelAccountId),
    queryFn: () =>
      unwrap(
        api.GET('/api/autoload/runs', {
          params: { query: { channelAccountId } },
        }),
      ),
    enabled: enabled && Boolean(channelAccountId),
  });
}

export function useAutoloadRunItems(runId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.autoloadRunItems(runId),
    queryFn: () =>
      unwrap(
        api.GET('/api/autoload/runs/{id}/items', {
          params: { path: { id: runId } },
        }),
      ),
    enabled: enabled && Boolean(runId),
  });
}

export function useAutoloadUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelAccountId: string) =>
      unwrap(
        api.POST('/api/autoload/upload', {
          body: { channelAccountId },
        }),
      ),
    onSuccess: async (_data, channelAccountId) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.autoloadRuns(channelAccountId),
      });
    },
  });
}

export function useAutoloadRefreshReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelAccountId: string) =>
      unwrap(
        api.POST('/api/autoload/reports/refresh', {
          body: { channelAccountId },
        }),
      ),
    onSuccess: async (data, channelAccountId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.autoloadRuns(channelAccountId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.autoloadRunItems(data.id),
        }),
      ]);
    },
  });
}

export function useReviews(params: { page: number; perPage: number }) {
  return useQuery({
    queryKey: queryKeys.reviews(params),
    queryFn: () =>
      unwrap(
        api.GET('/api/reviews', {
          params: {
            query: {
              page: params.page,
              perPage: params.perPage,
            },
          },
        }),
      ),
  });
}

export function useAnswerReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { reviewId: string; text: string }) =>
      unwrap(
        api.POST('/api/reviews/{id}/answer', {
          params: { path: { id: input.reviewId } },
          body: { text: input.text },
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
