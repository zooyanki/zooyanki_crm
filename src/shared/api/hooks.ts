import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, tenantHeader, unwrap } from './client';
import type { components } from './generated/schema';
import { queryKeys } from './query-keys';

export type ListingView = components['schemas']['ListingViewDto'];
export type ListingListResult = components['schemas']['ListingListResultDto'];
export type DailyTotals = components['schemas']['DailyTotalsDto'];
export type ChannelAccount = components['schemas']['ChannelAccountViewDto'];
export type ListingStatus = ListingView['status'];

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
            header: tenantHeader(),
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

export function useDailyAnalytics() {
  return useQuery({
    queryKey: queryKeys.analyticsDaily(),
    queryFn: () =>
      unwrap(
        api.GET('/api/analytics/daily', {
          params: { header: tenantHeader() },
        }),
      ),
  });
}

export function useChannelAccounts() {
  return useQuery({
    queryKey: queryKeys.channelAccounts(),
    queryFn: () =>
      unwrap(
        api.GET('/api/channel-accounts', {
          params: { header: tenantHeader() },
        }),
      ),
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: components['schemas']['TriggerSyncDto']) =>
      unwrap(
        api.POST('/api/sync/trigger', {
          params: { header: tenantHeader() },
          body,
        }),
      ),
    onSuccess: async (_data, variables) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['listings'] }),
        variables.entity === 'stats'
          ? queryClient.invalidateQueries({ queryKey: queryKeys.analyticsDaily() })
          : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: queryKeys.channelAccounts() }),
      ]);
    },
  });
}
