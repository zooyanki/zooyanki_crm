'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, RefreshCw, Send } from 'lucide-react';

import {
  useConversations,
  useMarkConversationRead,
  useMessages,
  useSendImageMessage,
  useSendTextMessage,
  useSyncConversationMessages,
  type ConversationView,
  type MessageView,
} from '@/shared/api/hooks';
import { formatDateTime } from '@/shared/lib/format';
import { CHANNEL_LABEL, MESSAGE_TYPE_LABEL } from '@/shared/lib/labels';
import { cn } from '@/shared/lib/utils';

const CONV_PER_PAGE = 30;
const MSG_PER_PAGE = 100;

function imageUrlFromContent(content: unknown): string | null {
  if (!content || typeof content !== 'object') return null;
  const record = content as Record<string, unknown>;
  for (const key of ['url', 'imageUrl', 'src']) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  const image = record.image;
  if (image && typeof image === 'object') {
    const sizes = (image as { sizes?: Record<string, string> }).sizes;
    if (sizes) {
      return (
        sizes['640x480'] ||
        sizes['1280x960'] ||
        sizes['140x105'] ||
        Object.values(sizes)[0] ||
        null
      );
    }
  }
  return null;
}

function messageBody(message: MessageView): string {
  if (message.bodyText?.trim()) return message.bodyText;
  if (message.type === 'IMAGE') return 'Изображение';
  return MESSAGE_TYPE_LABEL[message.type] ?? message.type;
}

function ConversationRow({
  conversation,
  active,
  onSelect,
}: {
  conversation: ConversationView;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-1 border-b border-zinc-100 px-4 py-3 text-left transition',
        active ? 'bg-teal-50/80' : 'hover:bg-zinc-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-zinc-900">
            {conversation.peerName || conversation.peerExternalId || 'Без имени'}
          </div>
          <div className="truncate text-xs text-zinc-500">
            {conversation.listingTitle ||
              conversation.listingExternalId ||
              CHANNEL_LABEL[conversation.channel] ||
              conversation.channel}
          </div>
        </div>
        {conversation.unreadCount > 0 ? (
          <span className="shrink-0 rounded-full bg-teal-700 px-2 py-0.5 text-[11px] font-medium text-white">
            {conversation.unreadCount}
          </span>
        ) : null}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate text-xs text-zinc-600">
          {conversation.lastMessageDirection === 'OUT' ? 'Вы: ' : ''}
          {conversation.lastMessagePreview || 'Нет сообщений'}
        </p>
        <span className="shrink-0 text-[11px] text-zinc-400">
          {formatDateTime(conversation.lastMessageAt)}
        </span>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: MessageView }) {
  const outgoing = message.direction === 'OUT';
  const imageUrl = message.type === 'IMAGE' ? imageUrlFromContent(message.contentJson) : null;

  return (
    <div className={cn('flex', outgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          outgoing
            ? 'rounded-br-md bg-zinc-900 text-white'
            : 'rounded-bl-md border border-zinc-200 bg-white text-zinc-900',
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={message.bodyText || 'Изображение'}
            className="mb-1 max-h-56 rounded-lg object-contain"
          />
        ) : null}
        <p className="whitespace-pre-wrap break-words">{messageBody(message)}</p>
        <div className="mt-1 text-[11px] text-zinc-400">
          {formatDateTime(message.sentAt)}
        </div>
      </div>
    </div>
  );
}

export function MessengerPanel() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const conversations = useConversations({ page, perPage: CONV_PER_PAGE });
  const messages = useMessages(
    selectedId ?? '',
    { page: 1, perPage: MSG_PER_PAGE },
    Boolean(selectedId),
  );

  const markRead = useMarkConversationRead();
  const syncMessages = useSyncConversationMessages();
  const sendText = useSendTextMessage();
  const sendImage = useSendImageMessage();

  const selected = useMemo(
    () => conversations.data?.items.find((item) => item.id === selectedId) ?? null,
    [conversations.data, selectedId],
  );

  const totalPages = useMemo(() => {
    if (!conversations.data) return 1;
    return Math.max(1, Math.ceil(conversations.data.total / conversations.data.perPage));
  }, [conversations.data]);

  useEffect(() => {
    if (!selectedId) return;
    markRead.mutate(selectedId);
    // mark once per selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.data?.items.length, selectedId]);

  const busy =
    sendText.isPending || sendImage.isPending || syncMessages.isPending;

  const onSend = async () => {
    if (!selectedId || busy) return;

    try {
      if (file) {
        await sendImage.mutateAsync({ conversationId: selectedId, file });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      const text = draft.trim();
      if (text) {
        await sendText.mutateAsync({ conversationId: selectedId, text });
        setDraft('');
      }
    } catch {
      // ошибка уже в mutation state
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur">
      <div className="grid min-h-[560px] lg:grid-cols-[320px_1fr]">
        <aside className="flex flex-col border-b border-zinc-100 lg:border-b-0 lg:border-r">
          <div className="border-b border-zinc-100 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-900">Диалоги</h2>
            <p className="text-xs text-zinc-500">
              {conversations.data
                ? `${conversations.data.total} всего`
                : 'Загрузка…'}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.isLoading ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-500">
                Загружаем диалоги…
              </p>
            ) : conversations.isError ? (
              <p className="px-4 py-10 text-center text-sm text-red-600">
                {conversations.error.message}
              </p>
            ) : conversations.data?.items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-zinc-500">
                Пока нет диалогов. Синхронизируйте чаты.
              </p>
            ) : (
              conversations.data?.items.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === selectedId}
                  onSelect={() => setSelectedId(conversation.id)}
                />
              ))
            )}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-3 py-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
              >
                Назад
              </button>
              <span className="text-xs text-zinc-500">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
              >
                Вперёд
              </button>
            </div>
          ) : null}
        </aside>

        <div className="flex min-h-[420px] flex-col">
          {!selectedId || !selected ? (
            <div className="flex flex-1 items-center justify-center px-6 text-sm text-zinc-500">
              Выберите диалог слева
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-zinc-900">
                    {selected.peerName || selected.peerExternalId || 'Диалог'}
                  </h3>
                  <p className="truncate text-xs text-zinc-500">
                    {[
                      CHANNEL_LABEL[selected.channel] ?? selected.channel,
                      selected.listingTitle,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={syncMessages.isPending}
                  onClick={() => syncMessages.mutate(selected.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40"
                >
                  <RefreshCw
                    className={cn('h-3.5 w-3.5', syncMessages.isPending && 'animate-spin')}
                  />
                  Обновить сообщения
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-zinc-50/60 px-4 py-4">
                {messages.isLoading ? (
                  <p className="py-10 text-center text-sm text-zinc-500">
                    Загружаем сообщения…
                  </p>
                ) : messages.isError ? (
                  <p className="py-10 text-center text-sm text-red-600">
                    {messages.error.message}
                  </p>
                ) : messages.data?.items.length === 0 ? (
                  <p className="py-10 text-center text-sm text-zinc-500">
                    Сообщений пока нет
                  </p>
                ) : (
                  messages.data?.items.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-zinc-100 px-4 py-3">
                {file ? (
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="ml-2 text-zinc-500 hover:text-zinc-800"
                    >
                      Убрать
                    </button>
                  </div>
                ) : null}

                {(sendText.isError || sendImage.isError || syncMessages.isError) && (
                  <p className="mb-2 text-sm text-red-600">
                    {sendText.error?.message ||
                      sendImage.error?.message ||
                      syncMessages.error?.message}
                  </p>
                )}

                {syncMessages.isSuccess ? (
                  <p className="mb-2 text-sm text-teal-700">
                    Подтянуто сообщений: {syncMessages.data.fetched}
                  </p>
                ) : null}

                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      setFile(event.target.files?.[0] ?? null);
                    }}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-zinc-200 bg-white p-2.5 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40"
                    title="Прикрепить изображение"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void onSend();
                      }
                    }}
                    rows={2}
                    placeholder="Напишите сообщение…"
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-teal-700/30 placeholder:text-zinc-400 focus:ring-2"
                  />
                  <button
                    type="button"
                    disabled={busy || (!draft.trim() && !file)}
                    onClick={() => void onSend()}
                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    Отправить
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
