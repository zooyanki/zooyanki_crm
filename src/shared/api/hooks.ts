import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clearAccessToken, setAccessToken } from '@/shared/auth/session';

import { api, unwrap } from './client';
import type { components } from './generated/schema';
import { queryKeys } from './query-keys';

export type ListingView = components['schemas']['ListingViewDto'];
export type ListingListResult = components['schemas']['ListingListResultDto'];
export type DailyTotals = components['schemas']['DailyTotalsDto'];
export type ChannelAccount = components['schemas']['ChannelAccountViewDto'];
export type ListingStatus = ListingView['status'];
export type AuthResponse = components['schemas']['AuthResponseDto'];
export type MeResponse = components['schemas']['MeResponseDto'];

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

export function useDailyAnalytics() {
  return useQuery({
    queryKey: queryKeys.analyticsDaily(),
    queryFn: () => unwrap(api.GET('/api/analytics/daily')),
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
        queryClient.invalidateQueries({ queryKey: queryKeys.channelAccounts() }),
      ]);
    },
  });
}
