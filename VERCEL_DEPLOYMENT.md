# Развертывание на Vercel с Redis

## Настройка Redis для кэширования RSS

Проект использует Redis для кэширования RSS фидов, что значительно ускоряет загрузку и снижает нагрузку на источники новостей.

### Вариант 1: Vercel KV (Рекомендуется) ⭐

**Преимущества:**
- Встроенное решение Vercel
- Автоматическая настройка
- Бесплатный tier (до 30,000 команд/день)
- Минимальная задержка

**Шаги настройки:**

1. **Создайте базу данных KV:**
   ```bash
   # В панели Vercel:
   # Project → Storage → Create Database → KV (Redis)
   ```

2. **Получите URL подключения:**
   - После создания базы данных Vercel покажет переменные окружения
   - Найдите `KV_REST_API_URL` или создайте переменную `REDIS_URL`

3. **Настройте переменные окружения:**
   
   В панели Vercel (Project → Settings → Environment Variables):
   ```
   REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_KV_ENDPOINT.kv.vercel-storage.com
   ```
   
   Или используйте встроенную переменную:
   ```
   KV_URL=redis://default:YOUR_PASSWORD@YOUR_KV_ENDPOINT.kv.vercel-storage.com
   ```

4. **Настройте TTL (опционально):**
   ```
   RSS_CACHE_TTL_SECONDS=300  # 5 минут по умолчанию
   ```

### Вариант 2: Upstash Redis

**Преимущества:**
- Щедрый бесплатный tier
- Serverless-оптимизированный
- Глобальные регионы

**Шаги настройки:**

1. **Создайте базу данных на [Upstash](https://upstash.com/):**
   - Зарегистрируйтесь на upstash.com
   - Create Database → выберите регион ближе к вашим пользователям
   - Выберите "Regional" или "Global"

2. **Скопируйте Redis URL:**
   - В разделе "Details" найдите "UPSTASH_REDIS_REST_URL"
   - Или используйте стандартный Redis URL формат

3. **Добавьте в Vercel:**
   
   В панели Vercel (Project → Settings → Environment Variables):
   ```
   REDIS_URL=rediss://default:YOUR_UPSTASH_PASSWORD@YOUR_REGION.upstash.io:6379
   ```

### Вариант 3: Другие Redis провайдеры

Любой Redis провайдер, поддерживающий стандартный Redis протокол:

- **Redis Cloud** (бесплатно до 30MB)
- **Railway** (простой в настройке)
- **AWS ElastiCache** (для production)
- **Собственный сервер Redis**

**Настройка:**
```
REDIS_URL=redis://username:password@hostname:6379
# или с TLS:
REDIS_URL=rediss://username:password@hostname:6380
```

## Полный список переменных окружения для Vercel

```env
# Обязательные
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app
WEBSUB_CALLBACK_BASE_URL=https://your-site.vercel.app

# Redis (опционально, но рекомендуется)
REDIS_URL=redis://your-redis-url
# или
KV_URL=redis://your-vercel-kv-url

# Кэш RSS (опционально)
RSS_CACHE_TTL_SECONDS=300

# AI Summarization (если используете)
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_BASE_URL=https://api.openai.com/v1

# WebSub (опционально)
NEXT_PUBLIC_WEBSUB_HUB=https://pubsubhubbub.appspot.com/

# Summary Cache (опционально)
SUMMARY_CACHE_TTL_MS=1800000
```

## Проверка работы Redis

После развертывания проверьте логи Vercel:

1. Откройте Vercel Dashboard → Project → Deployments → Latest
2. Перейдите в "Functions" и откройте любую функцию
3. Проверьте логи на наличие:
   - ✅ `"Redis client initialized successfully"` - Redis подключен
   - ⚠️  `"Redis URL not configured - caching disabled"` - Redis не настроен (будет работать без кэша)
   - ❌ `"Redis connection error"` - проблема с подключением

## Тестирование локально

Для локальной разработки с Redis:

1. **Запустите локальный Redis:**
   ```bash
   # Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Или установите Redis
   # macOS: brew install redis && redis-server
   # Linux: sudo apt install redis-server && redis-server
   ```

2. **Настройте .env.local:**
   ```env
   REDIS_URL=redis://localhost:6379
   ```

3. **Запустите проект:**
   ```bash
   npm run dev
   ```

## Мониторинг и отладка

### Просмотр кэша

Используйте Redis CLI или Upstash Console для просмотра закэшированных данных:

```bash
# Посмотреть все ключи кэша
KEYS rss-cache:*

# Посмотреть конкретный кэш
GET rss-cache:https://example.com/feed.xml

# Очистить кэш
FLUSHDB
```

### Метрики производительности

В логах Vercel вы увидите:
- Cache hits (данные взяты из кэша)
- Cache misses (данные загружены заново)
- Время ответа с кэшем vs без кэша

## Troubleshooting

### Проблема: "Redis connection timeout"
**Решение:** 
- Проверьте, что Redis URL правильный
- Убедитесь, что используете `rediss://` (с TLS) для production
- Проверьте firewall настройки Redis провайдера

### Проблема: "Too many connections"
**Решение:**
- Увеличьте `maxRetriesPerRequest` в конфиге
- Используйте connection pooling
- Перейдите на plan с большим количеством подключений

### Проблема: Кэш не обновляется
**Решение:**
- Проверьте `RSS_CACHE_TTL_SECONDS` - возможно слишком большой
- Очистите кэш вручную через Redis CLI
- Перезапустите deployment

## Оптимизация

### Настройка TTL

Рекомендуемые значения TTL в зависимости от частоты обновления источников:

```env
# Новостные сайты (обновляются часто)
RSS_CACHE_TTL_SECONDS=180  # 3 минуты

# Блоги (обновляются умеренно)
RSS_CACHE_TTL_SECONDS=600  # 10 минут

# Редко обновляемые источники
RSS_CACHE_TTL_SECONDS=1800  # 30 минут
```

### Мониторинг использования

Vercel KV бесплатный tier:
- ✅ 30,000 команд/день
- ✅ 256MB хранилища
- ✅ Unlimited bandwidth

Upstash бесплатный tier:
- ✅ 10,000 команд/день
- ✅ 256MB хранилища
- ✅ Multiple regions

## Дополнительные ресурсы

- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Documentation](https://docs.upstash.com/redis)
- [ioredis Documentation](https://github.com/redis/ioredis)

