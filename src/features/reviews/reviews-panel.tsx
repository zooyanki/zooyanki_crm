'use client';

import { useMemo, useState } from 'react';

import {
  useAnswerReview,
  useReviews,
  type ReviewView,
} from '@/shared/api/hooks';
import { formatDateTime } from '@/shared/lib/format';
import { CHANNEL_LABEL } from '@/shared/lib/labels';
import { cn } from '@/shared/lib/utils';

const PER_PAGE = 20;

export function ReviewsPanel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, isFetching } = useReviews({
    page,
    perPage: PER_PAGE,
  });

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.perPage));
  }, [data]);

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Отзывы</h2>
        <p className="text-sm text-zinc-500">
          {data ? `${data.total} отзывов` : 'Загрузка…'}
          {isFetching && !isLoading ? ' · обновляем' : ''}
        </p>
      </div>

      {isLoading ? (
        <p className="px-5 py-16 text-center text-sm text-zinc-500">Загружаем отзывы…</p>
      ) : isError ? (
        <p className="px-5 py-16 text-center text-sm text-red-600">
          Не удалось загрузить отзывы: {error.message}
        </p>
      ) : !data || data.items.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-zinc-500">
          Отзывов пока нет. Нажмите «Обновить отзывы», чтобы подтянуть их с площадки.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-zinc-100">
            {data.items.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>

          {data.total > PER_PAGE ? (
            <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-sm">
              <span className="text-zinc-500">
                Стр. {page} из {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Назад
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Вперёд
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function ReviewCard({ review }: { review: ReviewView }) {
  const answer = useAnswerReview();
  const [text, setText] = useState('');

  const scoreStars = '★'.repeat(Math.max(0, Math.min(5, review.score)));

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold tabular-nums text-amber-700" title={`${review.score}/5`}>
              {scoreStars || '—'}
              <span className="ml-1 text-sm font-medium text-zinc-500">{review.score}/5</span>
            </span>
            <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {CHANNEL_LABEL[review.channel] ?? review.channel}
            </span>
            {review.stage ? (
              <span className="text-xs text-zinc-400">{review.stage}</span>
            ) : null}
          </div>

          <div className="mt-1 text-sm text-zinc-500">
            {review.authorName ?? 'Покупатель'}
            {review.publishedAt ? ` · ${formatDateTime(review.publishedAt)}` : ''}
          </div>

          {review.itemTitle ? (
            <p className="mt-1 text-sm font-medium text-zinc-800">{review.itemTitle}</p>
          ) : null}

          {review.text ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{review.text}</p>
          ) : (
            <p className="mt-2 text-sm italic text-zinc-400">Без текста</p>
          )}

          {review.answerText ? (
            <div className="mt-3 rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2">
              <div className="text-xs font-medium uppercase tracking-wide text-teal-800/80">
                Ваш ответ
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{review.answerText}</p>
            </div>
          ) : null}
        </div>
      </div>

      {review.canAnswer && !review.answerText ? (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = text.trim();
            if (trimmed.length < 2) return;
            answer.mutate(
              { reviewId: review.id, text: trimmed },
              {
                onSuccess: () => setText(''),
              },
            );
          }}
        >
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            placeholder="Ответ покупателю…"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={answer.isPending || text.trim().length < 2}
              className={cn(
                'rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40',
              )}
            >
              {answer.isPending ? 'Отправляем…' : 'Ответить'}
            </button>
            {answer.isError ? (
              <p className="text-sm text-red-600">{answer.error.message}</p>
            ) : null}
          </div>
        </form>
      ) : null}
    </li>
  );
}
