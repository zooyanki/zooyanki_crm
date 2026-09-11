# Zooyanki CRM — веб-интерфейс

Фронтенд мультимаркетплейс CRM для управления продажами на Avito, Ozon,
Wildberries и Drom из одного инструмента. Сейчас в работе — Авито.

Стек: Next.js (App Router), TypeScript, TanStack Query, Tailwind.

## Бэкенд

Живёт в отдельном репозитории `zooyanki_crm_back`, рядом в
`C:\Users\Илья\My projects\CRM\zooyanki_crm_back`.

Там же вся общая документация проекта — не дублируй её здесь:

- `docs/01-vision.md` — цель продукта и границы
- `docs/03-roadmap.md` — текущая фаза и что в неё входит
- `docs/02-architecture.md` — устройство бэкенда
- `docs/adr/` — принятые решения и их причины

## Инварианты

- **Типы API не пишутся руками.** Бэкенд отдаёт OpenAPI-схему через
  `@nestjs/swagger`; типы генерируются из неё через `openapi-typescript`
  в `src/shared/api/generated/`. Ручные DTO, дублирующие ответы бэкенда,
  запрещены — именно они разъезжаются между репозиториями.
- Обращения к API — только через слой `src/shared/api/`, серверное состояние
  держит TanStack Query. Голый `fetch` в компонентах не используем.
- Авторизация — Bearer JWT из `localStorage`. Заголовок `x-tenant-id`
  больше не используется: арендатор сидит в токене.
- Интерфейс не знает о площадках. Он работает с каноническими моделями
  (товар, заказ, диалог) и показывает канал как атрибут, а не как отдельный
  раздел с особой логикой. Специальные случаи под Авито в компонентах —
  признак того, что различие нужно было закрыть на бэкенде.
- Язык интерфейса и общения с пользователем — русский.

## Текущая фаза

Фаза 1: список объявлений Авито и графики показов и контактов.
Подробности в `docs/03-roadmap.md` бэкенд-репозитория.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
