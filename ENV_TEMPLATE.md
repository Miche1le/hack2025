# Шаблон переменных окружения

## Для создания `.env.local` скопируйте нужные переменные:

```env
# ===========================================
# ОСНОВНЫЕ НАСТРОЙКИ (обязательно)
# ===========================================

# Публичный URL вашего сайта
NEXT_PUBLIC_SITE_URL=https://your-site.vercel.app

# Базовый URL для WebSub колбэков
WEBSUB_CALLBACK_BASE_URL=https://your-site.vercel.app

# ===========================================
# REDIS КЭШИРОВАНИЕ (рекомендуется)
# ===========================================

# Локальная разработка:
REDIS_URL=redis://localhost:6379

# Vercel KV (после подключения Storage):
# KV_URL=redis://default:password@your-kv.kv.vercel-storage.com

# Upstash или другие провайдеры:
# REDIS_URL=rediss://default:password@your-region.upstash.io:6379

# Время жизни кэша RSS (секунды, по умолчанию 300)
RSS_CACHE_TTL_SECONDS=300

# ===========================================
# AI SUMMARIZATION (опционально)
# ===========================================

# OpenAI API:
# OPENAI_API_KEY=sk-your-openai-api-key
# OPENAI_MODEL=gpt-3.5-turbo
# OPENAI_BASE_URL=https://api.openai.com/v1

# Ollama локально:
OPENAI_API_KEY=sk-local
OPENAI_MODEL=llama3.1:8b-instruct-q4_0
OPENAI_BASE_URL=http://localhost:11434/v1

# Кэш саммари (миллисекунды)
SUMMARY_CACHE_TTL_MS=1800000

# ===========================================
# WEBSUB (опционально)
# ===========================================

# Предпочитаемый WebSub hub
NEXT_PUBLIC_WEBSUB_HUB=https://pubsubhubbub.appspot.com/
```

## Быстрый старт

1. **Локальная разработка без Redis:**
   ```bash
   echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" > .env.local
   echo "WEBSUB_CALLBACK_BASE_URL=http://localhost:3000" >> .env.local
   npm run dev
   ```

2. **Локальная разработка с Redis:**
   ```bash
   # Запустите Redis
   docker run -d -p 6379:6379 redis:alpine
   
   # Создайте .env.local
   cat > .env.local << EOF
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   WEBSUB_CALLBACK_BASE_URL=http://localhost:3000
   REDIS_URL=redis://localhost:6379
   EOF
   
   npm run dev
   ```

3. **Vercel (production):**
   - Добавьте переменные в Vercel Dashboard → Settings → Environment Variables
   - См. [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) для подробных инструкций

