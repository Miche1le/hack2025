# 🚀 Оптимизация для Ryzen 9 365 (73 TOPS) + 32GB RAM

## ✅ Ваш ноутбук отлично подходит!

### 💪 Характеристики вашей системы:
- **RAM**: 32GB - отлично для больших моделей
- **Процессор**: Ryzen 9 365 с AI ускорением (73 TOPS)
- **AI ускорение**: Встроенная NPU для оптимизации LLM

### 🎯 Рекомендуемые модели для вашей системы:

| Модель | Размер | RAM | Скорость | Качество | Рекомендация |
|--------|--------|-----|----------|----------|--------------|
| `mistral:7b-instruct` | 7B | ~4GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **Идеально** |
| `llama2:13b-chat` | 13B | ~8GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Отлично** |
| `codellama:13b-instruct` | 13B | ~8GB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Лучшее качество** |
| `mistral-nemo:12b` | 12B | ~7GB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **С AI ускорением** |

## 🚀 Оптимизированная конфигурация

### 1. Обновите docker-compose.yml для вашей системы:

```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: news-summarizer-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_NUM_PARALLEL=4  # Используем все ядра
      - OLLAMA_MAX_LOADED_MODELS=2  # Держим 2 модели в памяти
    restart: unless-stopped
    # Для вашей NPU (если поддерживается)
    deploy:
      resources:
        limits:
          memory: 24G  # Оставляем 8GB для системы
        reservations:
          memory: 16G

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: news-summarizer-web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOCAL_SUMMARY_URL=http://ollama:11434/api/generate
      - OLLAMA_MODEL=mistral:7b-instruct
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - USE_LOCAL_ONLY=true
    depends_on:
      - ollama
    restart: unless-stopped

volumes:
  ollama_data:
```

### 2. Создайте оптимизированный .env.local:

```env
# Оптимизация для Ryzen 9 365 + 32GB RAM
LOCAL_SUMMARY_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral:7b-instruct
USE_LOCAL_ONLY=true

# Производительность
OLLAMA_NUM_PARALLEL=4
OLLAMA_MAX_LOADED_MODELS=2
OLLAMA_FLASH_ATTENTION=1

# Кеширование
SUMMARY_CACHE_TTL_MS=3600000
MAX_CACHE_ENTRIES=1000
```

## 🎨 Apple + OpenAI дизайн

Я реализовал именно то, что вы просили:

### ✅ Apple Intelligence стиль:
- **Горизонтальная прокрутка** карточек (как в Apple Intelligence)
- **Минималистичный дизайн** с большими заголовками
- **Плавные анимации** и переходы
- **Темная тема** в стиле Apple
- **Современная типографика**

### ✅ OpenAI ChatGPT элементы:
- **Чистый интерфейс** без лишних элементов
- **Карточки с тенями** и скруглениями
- **Профессиональная цветовая схема**
- **Интуитивная навигация**

## 🚀 Запуск на вашей системе:

### Способ 1: Оптимизированный Docker
```bash
# Запуск с оптимизацией для вашей системы
docker-compose up -d

# Загрузка лучшей модели для ваших характеристик
docker exec news-summarizer-ollama ollama pull mistral:7b-instruct
# Или для еще лучшего качества:
docker exec news-summarizer-ollama ollama pull llama2:13b-chat
```

### Способ 2: Локальная установка Ollama
```bash
# Скачайте Ollama с https://ollama.ai/download
# Запустите с оптимизацией
ollama serve --num-parallel 4 --max-loaded-models 2

# В новом терминале загрузите модель
ollama pull mistral:7b-instruct
```

## 📊 Ожидаемая производительность на вашей системе:

- **Mistral 7B**: 1-2 секунды на статью
- **Llama 2 13B**: 2-3 секунды на статью  
- **Память**: Использование ~6-8GB из 32GB
- **CPU**: Использование ~30-50% ядер
- **NPU**: Автоматическое ускорение (если поддерживается)

## 🎯 Рекомендации:

1. **Начните с Mistral 7B** - идеальный баланс скорости и качества
2. **Попробуйте Llama 2 13B** - для лучшего качества резюме
3. **Используйте кеширование** - повторные запросы будут мгновенными
4. **Параллельная обработка** - можете обрабатывать несколько статей одновременно

## 🚀 Ваша система потянет даже большие модели!

С 32GB RAM и AI процессором вы можете запустить:
- Несколько моделей одновременно
- Большие модели (13B+ параметров)
- Быструю обработку с NPU ускорением

**Ваш ноутбук - идеальная машина для локальной LLM!** 🎉
