# Персональный агрегатор новостей

Монорепозиторий на базе PNPM для серверной части агрегатора новостей (Next.js 14 + TypeScript). Репозиторий содержит API маршруты, общие утилиты и базовую инфраструктуру CI/CD.

## Структура репозитория

```
.
├─ apps/
│  └─ web/              # Next.js (App Router) — API и клиент
├─ packages/
│  └─ shared/           # Общие утилиты и функции
├─ services/
│  └─ api/              # Дополнительная серверная логика (по мере необходимости)
├─ docs/                # Документация и технические заметки
├─ .github/workflows/   # CI/CD пайплайны
└─ README.md
```

## Быстрый старт

1. Установите PNPM версии `8.15.4`.
2. Установите зависимости: `pnpm install`.
3. Запустите проверки качества:
   - Линтер: `pnpm lint`
   - Тесты: `pnpm test`
   - TypeScript build (type-check): `pnpm build`

## Локальный запуск API

Next.js-приложение ещё не развёрнуто, но API маршруты уже доступны. После добавления UI можно использовать стандартные команды Next.js:

```bash
cd apps/web
pnpm next dev
```

API контракт `/api/fetch` реализован в `apps/web/app/api/fetch/route.ts`. Пример запроса:

```bash
curl -X POST http://localhost:3000/api/fetch \
  -H "Content-Type: application/json" \
  -d '{
    "feeds": ["https://example.com/rss"],
    "query": "ai, экономика"
  }'
```

## Переменные окружения

| Переменная              | Назначение                                              |
| ----------------------- | ------------------------------------------------------- |
| `OPENAI_API_KEY`        | API-ключ OpenAI для генерации кратких сводок.           |
| `OPENAI_MODEL`          | Необязательная замена модели (по умолчанию `gpt-3.5-turbo`). |
| `VERCEL_TOKEN`          | Токен доступа для Vercel Deploy (используется в CI).    |
| `VERCEL_ORG_ID`         | Идентификатор организации Vercel.                       |
| `VERCEL_PROJECT_ID`     | Идентификатор проекта Vercel.                           |

> **Примечание:** секреты для деплоя необходимо добавить в репозиторные Secrets GitHub.

## Тестирование

- `pnpm test` — запускает Vitest (`*.test.ts`), включая сценарии дедупликации и fallback-сводки.
- `pnpm test:watch` — интерактивный режим тестов.

## Линтинг и форматирование

- ESLint (`pnpm lint`) проверяет TypeScript/JavaScript код.
- Prettier (`.prettierrc`) и `.editorconfig` задают единый стиль кода.

## CI/CD

- `.github/workflows/ci.yml` — сборка, линт и тесты на ветках `dev` и PR.
- `.github/workflows/deploy.yml` — черновик деплоя в Vercel (запускается на `main`). Требуется подключение Vercel CLI и секретов — см. TODO в workflow и раздел переменных окружения.

## Ограничения и TODO

- UI (`apps/web/app/page.tsx`) и клиентские компоненты не реализованы — зона ответственности команды IDE.
- В `deploy.yml` необходимо подключить фактическую команду деплоя (например, `vercel deploy`).
- Для ускорения LLM-сводок можно добавить кэширование и ограничение параллелизма.
