import type {
  AutoloadRunStatus,
  ListingStatus,
  MessageType,
  OrderStatus,
} from '@/shared/api/hooks';

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  ACTIVE: 'Активно',
  BLOCKED: 'Заблокировано',
  ARCHIVED: 'В архиве',
  REJECTED: 'Отклонено',
  REMOVED: 'Удалено',
  OLD: 'Снято',
  UNKNOWN: 'Неизвестно',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: 'Ждёт подтверждения',
  READY_TO_SHIP: 'К отправке',
  IN_TRANSIT: 'В пути',
  DELIVERED: 'Доставлен',
  CANCELED: 'Отменён',
  ON_RETURN: 'На возврате',
  IN_DISPUTE: 'Спор',
  CLOSED: 'Закрыт',
  UNKNOWN: 'Неизвестно',
};

export const ORDER_ACTION_LABEL: Record<string, string> = {
  confirm: 'Подтвердить',
  reject: 'Отменить',
  perform: 'Отправлено',
  receive: 'Доставлено',
  setTrackNumber: 'Трек-номер',
  fixTrackNumber: 'Исправить трек',
  acceptReturnOrder: 'Принять возврат',
  downloadLabels: 'Этикетка',
  setMarkings: 'Честный знак',
  getCourierDeliveryRange: 'Окна курьера',
  setCourierDeliveryRange: 'Вызвать курьера',
  setCNCDetails: 'Самовывоз CNC',
};

export const VAS_SLUG_LABEL: Record<string, string> = {
  xl: 'XL-объявление',
  highlight: 'Выделение',
  x2_1: 'x2 на 1 день',
  x2_7: 'x2 на 7 дней',
  x5_1: 'x5 на 1 день',
  x5_7: 'x5 на 7 дней',
  x10_1: 'x10 на 1 день',
  x10_7: 'x10 на 7 дней',
  stickerpack_x1: 'Стикеры ×1',
  stickerpack_x2: 'Стикеры ×2',
  stickerpack_x3: 'Стикеры ×3',
};

export const MESSAGE_TYPE_LABEL: Record<MessageType, string> = {
  TEXT: 'Текст',
  IMAGE: 'Изображение',
  LINK: 'Ссылка',
  ITEM: 'Объявление',
  LOCATION: 'Геолокация',
  CALL: 'Звонок',
  VOICE: 'Голосовое',
  SYSTEM: 'Системное',
  DELETED: 'Удалено',
  OTHER: 'Сообщение',
};

export const CHANNEL_LABEL: Record<string, string> = {
  AVITO: 'Авито',
  OZON: 'Ozon',
  WILDBERRIES: 'Wildberries',
  DROM: 'Drom',
};

export const AUTOLOAD_RUN_STATUS_LABEL: Record<AutoloadRunStatus, string> = {
  PENDING: 'В очереди',
  RUNNING: 'Выполняется',
  COMPLETED: 'Завершена',
  FAILED: 'Ошибка',
};
