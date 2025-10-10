# 🚀 Быстрый старт на Vercel с Redis

## За 5 минут разверните проект с кэшированием

### Шаг 1: Деплой на Vercel (2 мин)

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# Разверните проект
vercel
```

Или через веб-интерфейс:
1. Зайдите на [vercel.com](https://vercel.com)
2. New Project → Import Git Repository
3. Выберите ваш репозиторий

### Шаг 2: Настройте обязательные переменные (1 мин)

В Vercel Dashboard → Project → Settings → Environment Variables добавьте:

```
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
WEBSUB_CALLBACK_BASE_URL=https://your-project.vercel.app
```

💡 **Важно:** Замените `your-project` на реальное имя вашего проекта

### Шаг 3: Добавьте Redis кэширование (2 мин) ⭐

#### Вариант A: Vercel KV (рекомендуется)

1. В Vercel Dashboard → Project → Storage
2. Create Database → KV (Redis)
3. Connect to Project → выберите ваш проект
4. Готово! Vercel автоматически добавит переменные

#### Вариант B: Upstash (бесплатная альтернатива)

1. Зарегистрируйтесь на [upstash.com](https://upstash.com)
2. Create Database → выберите регион
3. Скопируйте `UPSTASH_REDIS_REST_URL`
4. В Vercel добавьте переменную:
   ```
   REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_REGION.upstash.io:6379
   ```

### Шаг 4: Redeploy (10 сек)

```bash
vercel --prod
```

Или в веб-интерфейсе: Deployments → Redeploy

## ✅ Проверка

Откройте ваш сайт и проверьте логи:

```bash
# В Vercel Dashboard
Deployments → Latest → Functions → любая функция → Logs

# Должно быть:
✅ "Redis client initialized successfully"
```

## 🎉 Готово!

Ваш сайт работает с кэшированием. RSS фиды будут загружаться в 10x быстрее!

## Опциональные улучшения

### Добавить AI суммаризацию

```env
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_BASE_URL=https://api.openai.com/v1
```

### Настроить время кэширования

```env
# Для новостных сайтов (часто обновляются)
RSS_CACHE_TTL_SECONDS=180

# Для блогов (редко обновляются)
RSS_CACHE_TTL_SECONDS=600
```

## Troubleshooting

**Проблема:** Redis не подключается
- Проверьте, что `REDIS_URL` или `KV_URL` правильно настроены
- Для production используйте `rediss://` (с TLS)

**Проблема:** Кэш не работает
- Проверьте логи: "Redis client initialized successfully"
- Очистите кэш в Upstash/Vercel KV консоли

**Проблема:** Сайт медленный
- Увеличьте `RSS_CACHE_TTL_SECONDS`
- Проверьте регион Redis (должен быть близко к вашим пользователям)

## Дополнительная информация

- Полная инструкция: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- Переменные окружения: [ENV_TEMPLATE.md](./ENV_TEMPLATE.md)
- Основная документация: [README.md](./README.md)

---

**Нужна помощь?** Проверьте логи в Vercel Dashboard или откройте issue в репозитории.

