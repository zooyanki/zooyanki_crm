import type { ListingStatus } from '@/shared/api/hooks';

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  ACTIVE: 'Активно',
  BLOCKED: 'Заблокировано',
  ARCHIVED: 'В архиве',
  REJECTED: 'Отклонено',
  REMOVED: 'Удалено',
  OLD: 'Снято',
  UNKNOWN: 'Неизвестно',
};

export const CHANNEL_LABEL: Record<string, string> = {
  AVITO: 'Авито',
  OZON: 'Ozon',
  WILDBERRIES: 'Wildberries',
  DROM: 'Drom',
};
